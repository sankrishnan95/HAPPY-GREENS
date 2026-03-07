const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:HappyGreens@123@localhost:5433/happy_greens' });

pool.query("INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES ($1, $2, $3, $4, $5)", [1, 100, 'placed', 'cod', JSON.stringify({})])
    .then(res => console.log('Success'))
    .catch(err => {
        console.log('ERROR MESSAGE:', err.message);
        console.log('CONSTRAINT:', err.constraint);
        console.log('DETAIL:', err.detail);
    })
    .finally(() => pool.end());
