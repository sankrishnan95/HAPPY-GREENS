const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:HappyGreens@123@localhost:5433/happy_greens' });

async function test() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const orderRes = await client.query(
            'INSERT INTO orders (user_id, total_amount, status, payment_method, payment_intent_id, shipping_address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [1, 100, 'placed', 'cod', null, JSON.stringify({})]
        );
        const orderId = orderRes.rows[0].id;
        console.log('Order created:', orderId);

        await client.query(
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
            [orderId, 1, 'Fresh Apple', 2, 50]
        );
        console.log('Order item created');
        await client.query('ROLLBACK'); // rollback so we dont spam the db
    } catch (err) {
        console.error('DB ERROR:', err.message);
        console.error('CONSTRAINT:', err.constraint);
        console.error('DETAIL:', err.detail);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        pool.end();
    }
}
test();
