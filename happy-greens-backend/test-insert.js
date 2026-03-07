const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testInsert() {
    try {
        console.log('Testing simple order insert...');

        const customerResult = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['customer']);
        const customerId = customerResult.rows[0].id;

        console.log(`Customer ID: ${customerId}`);
        console.log('Attempting to insert order with status="paid"...');

        const result = await pool.query(
            'INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING *',
            [customerId, 500.00, 'paid', 'razorpay']
        );

        console.log('✅ Success! Order created:');
        console.log(result.rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:');
        console.error(error);
        process.exit(1);
    }
}

testInsert();
