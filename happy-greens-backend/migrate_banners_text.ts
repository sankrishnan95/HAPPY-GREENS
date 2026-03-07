import fs from 'fs';
import path from 'path';
import { pool } from './src/db';

async function runMigration() {
    try {
        console.log('Running banners text fields migration...');
        const sqlPath = path.join(__dirname, 'src', 'db', 'migrations', '011_add_banner_text_fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('Banners text fields migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
