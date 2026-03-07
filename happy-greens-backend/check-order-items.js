const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:HappyGreens@123@localhost:5433/happy_greens' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'").then(res => {
    console.log('order_items columns:', res.rows.map(r => r.column_name));
    pool.end();
}).catch(console.error);
