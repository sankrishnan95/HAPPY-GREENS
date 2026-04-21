require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'").then(res => {
    console.log('order_items columns:', res.rows.map(r => r.column_name));
    pool.end();
}).catch(console.error);
