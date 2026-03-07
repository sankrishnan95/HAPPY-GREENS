const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:HappyGreens@123@localhost:5433/happy_greens' });
pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'orders'").then(res => {
    console.log('Orders Columns:', res.rows);
    return pool.query("SELECT * FROM orders ORDER BY id DESC LIMIT 1");
}).then(res => {
    console.log('Last order:', res.rows);
    pool.end();
}).catch(console.error);
