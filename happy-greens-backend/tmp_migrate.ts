import { pool } from './src/db';

async function runMigration() {
    try {
        console.log('Running migration 009: Adding images array...');
        const sql = require('fs').readFileSync(require('path').join(__dirname, 'src/db/migrations/009_add_images_array.sql'), 'utf-8');
        await pool.query(sql);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
