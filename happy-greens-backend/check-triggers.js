const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkTriggers() {
    try {
        const triggers = await pool.query(`
            SELECT tgname, pg_get_triggerdef(oid) as definition
            FROM pg_trigger
            WHERE tgrelid = 'orders'::regclass AND tgisinternal = false
        `);

        console.log('Triggers on orders table:');
        triggers.rows.forEach(row => {
            console.log(`\n${row.tgname}:`);
            console.log(row.definition);
        });

        if (triggers.rows.length === 0) {
            console.log('No triggers found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTriggers();
