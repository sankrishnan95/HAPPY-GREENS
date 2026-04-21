require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'categories\'')
    .then(res => { console.log(res.rows); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
