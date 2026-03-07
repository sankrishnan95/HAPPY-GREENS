const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
    try {
        // Check orders table columns
        const columns = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'orders'
            ORDER BY ordinal_position
        `);

        console.log('Orders table columns:');
        console.table(columns.rows);

        // Check constraints
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'orders'::regclass
        `);

        console.log('\nOrders table constraints:');
        constraints.rows.forEach(row => {
            console.log(`\n${row.conname}:`);
            console.log(row.definition);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
