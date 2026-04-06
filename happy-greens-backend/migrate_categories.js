const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:HappyGreens@123@localhost:5433/happy_greens' });
pool.query(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
`)
.then(() => { console.log('Migration successful'); process.exit(0); })
.catch(err => { console.error(err); process.exit(1); });
