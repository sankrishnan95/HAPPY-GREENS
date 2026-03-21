import { Pool, PoolClient } from 'pg';
import { buildUnitConfig, calculateLineTotal, isValidQuantityForConfig, normalizeQuantityForUnit, roundCurrency } from './unit-pricing.service';

type DbClient = Pool | PoolClient;

interface OrderItemInput {
    product_id?: unknown;
    quantity?: unknown;
}

interface CalculatedOrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    price: number;
    pricePerUnit: number;
    minQty: number;
    stepQty: number;
}

export interface CalculatedOrderTotals {
    items: CalculatedOrderItem[];
    subtotal: number;
    validatedPointsUsed: number;
    deliveryFee: number;
    finalTotal: number;
}

export const calculateOrderTotals = async (
    dbClient: DbClient,
    rawItems: OrderItemInput[],
    requestedPointsUsed: unknown,
    userId: number
): Promise<CalculatedOrderTotals> => {
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
        `SELECT id, name, price, discount_price, price_per_unit, unit, min_qty, step_qty, is_active, is_deleted
         FROM products
         WHERE id = ANY($1::int[])`,
        [productIds]
    );

    const productMap = new Map<number, any>(
        productsResult.rows.map((row: any) => [Number(row.id), row])
    );

    const calculatedItems: CalculatedOrderItem[] = normalizedItems.map((item) => {
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
            pricePerUnit: config.pricePerUnit,
            minQty: config.minQty,
            stepQty: config.stepQty,
        };
    });

    const subtotal = roundCurrency(
        calculatedItems.reduce((sum, item) => sum + item.price, 0)
    );

    const requested = Number(requestedPointsUsed || 0);
    const safeRequested = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 0;

    const loyaltyResult = await dbClient.query(
        'SELECT loyalty_points FROM users WHERE id = $1',
        [userId]
    );
    const availablePoints = Number(loyaltyResult.rows[0]?.loyalty_points || 0);
    const maxRedeemable = Math.floor(subtotal * 0.5);
    const validatedPointsUsed = Math.max(0, Math.min(safeRequested, availablePoints, maxRedeemable));

    // Delivery fee: free for orders with subtotal >= 500, otherwise 30
    const FREE_DELIVERY_THRESHOLD = 500;
    const DELIVERY_FEE = 30;
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

    return {
        items: calculatedItems,
        subtotal,
        validatedPointsUsed,
        deliveryFee,
        finalTotal: roundCurrency(Math.max(0, subtotal - validatedPointsUsed + deliveryFee)),
    };
};
