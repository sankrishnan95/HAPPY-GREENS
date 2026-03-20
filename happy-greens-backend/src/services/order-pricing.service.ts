import { Pool, PoolClient } from 'pg';
import { pool } from '../db';

type DbClient = Pool | PoolClient;

interface OrderItemInput {
    product_id?: unknown;
    quantity?: unknown;
}

interface CalculatedOrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
}

export interface CalculatedOrderTotals {
    items: CalculatedOrderItem[];
    subtotal: number;
    validatedPointsUsed: number;
    finalTotal: number;
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

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

    if (normalizedItems.some((item) => !Number.isInteger(item.productId) || item.productId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100)) {
        throw new Error('INVALID_ITEMS');
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const productsResult = await dbClient.query(
        `SELECT id, name, price, discount_price, is_active, is_deleted
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

        const unitPrice = Number(product.discount_price ?? product.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error('INVALID_PRODUCT');
        }

        return {
            product_id: item.productId,
            product_name: String(product.name || '').trim(),
            quantity: item.quantity,
            price: roundCurrency(unitPrice),
        };
    });

    const subtotal = roundCurrency(
        calculatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
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

    return {
        items: calculatedItems,
        subtotal,
        validatedPointsUsed,
        finalTotal: roundCurrency(Math.max(0, subtotal - validatedPointsUsed)),
    };
};
