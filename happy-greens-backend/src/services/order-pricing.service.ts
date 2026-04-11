import { Pool, PoolClient } from 'pg';
import { buildUnitConfig, calculateLineTotal, isValidQuantityForConfig, normalizeQuantityForUnit, roundCurrency } from './unit-pricing.service';

type DbClient = Pool | PoolClient;

export interface OrderItemInput {
    product_id?: unknown;
    quantity?: unknown;
}

export interface CalculatedOrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    price: number;
    originalPrice: number;
    pricePerUnit: number;
    originalPricePerUnit: number;
    minQty: number;
    stepQty: number;
    category_id: number;
}

interface AppliedCouponResult {
    couponDiscount: number;
    validatedCouponId: number | null;
}

export interface CalculatedOrderTotals {
    items: CalculatedOrderItem[];
    subtotal: number;
    validatedPointsUsed: number;
    couponDiscount: number;
    validatedCouponId: number | null;
    deliveryFee: number;
    finalTotal: number;
}

export const COUPON_ERROR_CODES = new Set([
    'INVALID_COUPON',
    'COUPON_NOT_APPLICABLE',
    'COUPON_MIN_ORDER',
    'COUPON_USAGE_LIMIT',
]);

export const prepareCalculatedOrderItems = async (
    dbClient: DbClient,
    rawItems: OrderItemInput[]
): Promise<CalculatedOrderItem[]> => {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new Error('INVALID_ITEMS');
    }

    const normalizedItems = rawItems.map((item) => ({
        productId: Number(item?.product_id),
        quantity: Number(item?.quantity),
    }));

    if (normalizedItems.some((item) => !Number.isInteger(item.productId) || item.productId <= 0 || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
        throw new Error('INVALID_ITEMS');
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const productsResult = await dbClient.query(
        `SELECT id, name, price, discount_price, price_per_unit, unit, min_qty, step_qty, is_active, is_deleted, category_id
         FROM products
         WHERE id = ANY($1::int[])`,
        [productIds]
    );

    const productMap = new Map<number, any>(
        productsResult.rows.map((row: any) => [Number(row.id), row])
    );

    return normalizedItems.map((item) => {
        const product = productMap.get(item.productId);
        if (!product || product.is_deleted || product.is_active === false) {
            throw new Error('INVALID_PRODUCT');
        }

        const baseConfig = buildUnitConfig(product);
        const discountPrice = Number(product.discount_price);
        const pricePerUnit = Number.isFinite(discountPrice) && discountPrice >= 0
            ? roundCurrency(discountPrice)
            : baseConfig.pricePerUnit;
        const normalizedQuantity = normalizeQuantityForUnit(item.quantity, baseConfig.unit);
        const config = { ...baseConfig, pricePerUnit };

        if (!isValidQuantityForConfig(normalizedQuantity, config)) {
            throw new Error('INVALID_ITEMS');
        }

        return {
            product_id: item.productId,
            product_name: String(product.name || '').trim(),
            quantity: normalizedQuantity,
            unit: config.unit,
            price: calculateLineTotal(normalizedQuantity, config),
            originalPrice: calculateLineTotal(normalizedQuantity, baseConfig),
            pricePerUnit: config.pricePerUnit,
            originalPricePerUnit: baseConfig.pricePerUnit,
            minQty: config.minQty,
            stepQty: config.stepQty,
            category_id: product.category_id,
        };
    });
};

export const applyCouponToCalculatedItems = async (
    dbClient: DbClient,
    calculatedItems: CalculatedOrderItem[],
    couponCode: unknown,
    userId?: number | null
): Promise<AppliedCouponResult> => {
    if (typeof couponCode !== 'string' || !couponCode.trim()) {
        return {
            couponDiscount: 0,
            validatedCouponId: null,
        };
    }

    const couponResult = await dbClient.query(
        `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true AND valid_from <= NOW() AND valid_until >= NOW()`,
        [couponCode.trim()]
    );

    if (couponResult.rows.length === 0) {
        throw new Error('INVALID_COUPON');
    }

    const coupon = couponResult.rows[0];
    let applicableSubtotal = 0;

    calculatedItems.forEach((item) => {
        let isApplicable = true;
        if (coupon.applicable_category_id && Number(item.category_id) !== Number(coupon.applicable_category_id)) isApplicable = false;
        if (coupon.applicable_product_id && Number(item.product_id) !== Number(coupon.applicable_product_id)) isApplicable = false;
        if (isApplicable) applicableSubtotal += item.price;
    });

    if (applicableSubtotal <= 0) {
        throw new Error('COUPON_NOT_APPLICABLE');
    }

    if (applicableSubtotal < Number(coupon.min_order_amount || 0)) {
        throw new Error('COUPON_MIN_ORDER');
    }

    if (coupon.usage_limit && userId && Number.isInteger(Number(userId))) {
        const usageResult = await dbClient.query(
            'SELECT COUNT(*)::int AS count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
            [coupon.id, Number(userId)]
        );
        const userUsageCount = Number(usageResult.rows[0]?.count || 0);
        if (userUsageCount >= Number(coupon.usage_limit)) {
            throw new Error('COUPON_USAGE_LIMIT');
        }
    }

    let couponDiscount = 0;
    if (coupon.discount_type === 'flat') {
        couponDiscount = Number(coupon.discount_value);
    } else {
        couponDiscount = (applicableSubtotal * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount) {
            couponDiscount = Math.min(couponDiscount, Number(coupon.max_discount_amount));
        }
    }

    couponDiscount = Math.min(couponDiscount, applicableSubtotal);

    return {
        couponDiscount: roundCurrency(couponDiscount),
        validatedCouponId: Number(coupon.id),
    };
};

export const calculateOrderTotals = async (
    dbClient: DbClient,
    rawItems: OrderItemInput[],
    requestedPointsUsed: unknown,
    couponCode: unknown,
    userId: number
): Promise<CalculatedOrderTotals> => {
    const calculatedItems = await prepareCalculatedOrderItems(dbClient, rawItems);

    const subtotal = roundCurrency(
        calculatedItems.reduce((sum, item) => sum + item.price, 0)
    );

    const requested = Number(requestedPointsUsed || 0);
    const safeRequested = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 0;

    const safeUserId = Number(userId);
    let availablePoints = 0;
    if (Number.isInteger(safeUserId) && safeUserId > 0) {
        const loyaltyResult = await dbClient.query(
            'SELECT loyalty_points FROM users WHERE id = $1',
            [safeUserId]
        );
        availablePoints = Number(loyaltyResult.rows[0]?.loyalty_points || 0);
    }
    const maxRedeemable = Math.floor(subtotal * 0.5);
    const validatedPointsUsed = Math.max(0, Math.min(safeRequested, availablePoints, maxRedeemable));

    const { couponDiscount, validatedCouponId } = await applyCouponToCalculatedItems(
        dbClient,
        calculatedItems,
        couponCode,
        Number.isInteger(safeUserId) && safeUserId > 0 ? safeUserId : null
    );

    const totalAfterDiscounts = Math.max(0, subtotal - validatedPointsUsed - couponDiscount);
    
    // Delivery fee: free for orders with total >= 300, otherwise 30
    const FREE_DELIVERY_THRESHOLD = 300;
    const DELIVERY_FEE = 30;
    const deliveryFee = totalAfterDiscounts >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

    return {
        items: calculatedItems,
        subtotal,
        validatedPointsUsed,
        couponDiscount,
        validatedCouponId,
        deliveryFee,
        finalTotal: roundCurrency(totalAfterDiscounts + deliveryFee),
    };
};
