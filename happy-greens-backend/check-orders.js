const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkOrders() {
    try {
        const result = await pool.query(`
            SELECT id, status, payment_method, total_amount, created_at
            FROM orders
            ORDER BY id DESC
            LIMIT 20
        `);

        console.log('Existing orders:');
        console.table(result.rows);

        console.log('\nTotal orders:', result.rows.length);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkOrders();
