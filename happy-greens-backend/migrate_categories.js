require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
`)
.then(() => { console.log('Migration successful'); process.exit(0); })
.catch(err => { console.error(err); process.exit(1); });
