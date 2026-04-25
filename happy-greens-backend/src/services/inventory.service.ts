import { PoolClient, QueryResult } from 'pg';

type Queryable = Pick<PoolClient, 'query'>;

export const deductStockForDeliveredOrder = async (db: Queryable, orderId: number | string) => {
    const itemsResult = await db.query(
        `SELECT product_id, quantity
         FROM order_items
         WHERE order_id = $1`,
        [orderId]
    );

    for (const item of itemsResult.rows) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity || 0);

        if (!Number.isFinite(productId) || productId <= 0) continue;
        if (!Number.isFinite(quantity) || quantity <= 0) continue;

        await db.query(
            `UPDATE products
             SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - $1)
             WHERE id = $2`,
            [quantity, productId]
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
