require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES ($1, $2, $3, $4, $5)", [1, 100, 'placed', 'cod', JSON.stringify({})])
    .then(res => console.log('Success'))
    .catch(err => {
        console.log('ERROR MESSAGE:', err.message);
        console.log('CONSTRAINT:', err.constraint);
        console.log('DETAIL:', err.detail);
    })
    .finally(() => pool.end());
