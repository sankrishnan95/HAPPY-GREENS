const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:HappyGreens@123@localhost:5433/happy_greens' });
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'categories\'')
    .then(res => { console.log(res.rows); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
