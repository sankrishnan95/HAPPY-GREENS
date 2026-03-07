const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function copyExistingOrder() {
    try {
        console.log('Checking existing order structure...');

        // Get an existing order to see what works
        const existing = await pool.query('SELECT * FROM orders LIMIT 1');
        console.log('Existing order:');
        console.log(existing.rows[0]);

        // Now try to insert a similar one
        console.log('\nAttempting to insert similar order...');
        const result = await pool.query(
            'INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING *',
            [existing.rows[0].user_id, 999.99, existing.rows[0].status, existing.rows[0].payment_method]
        );

        console.log('✅ Success! Order created:');
        console.log(result.rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

copyExistingOrder();
