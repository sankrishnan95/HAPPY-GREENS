import { PoolClient, QueryResult } from 'pg';

type Queryable = Pick<PoolClient, 'query'>;
const STOCK_UNIT_TOLERANCE = 0.000001;

export const deductStockForDeliveredOrder = async (db: Queryable, orderId: number | string) => {
    const itemsResult = await db.query(
        `SELECT oi.product_id, oi.quantity, p.min_qty
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [orderId]
    );

    for (const item of itemsResult.rows) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity || 0);
        const minQty = Number(item.min_qty || 1);

        if (!Number.isFinite(productId) || productId <= 0) continue;
        if (!Number.isFinite(quantity) || quantity <= 0) continue;
        if (!Number.isFinite(minQty) || minQty <= 0) continue;

        const stockUnitsToDeduct = Math.max(1, Math.ceil((quantity / minQty) - STOCK_UNIT_TOLERANCE));

        await db.query(
            `UPDATE products
             SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - $1)
             WHERE id = $2`,
            [stockUnitsToDeduct, productId]
        );
    }
};

export const hasDeliveredStockDeduction = async (db: Queryable, orderId: number | string) => {
    const result: QueryResult<{ already_deducted: boolean }> = await db.query(
        `SELECT EXISTS(
            SELECT 1
            FROM order_status_history
            WHERE order_id = $1
              AND new_status = 'delivered'
         ) AS already_deducted`,
        [orderId]
    );

    return Boolean(result.rows[0]?.already_deducted);
};
