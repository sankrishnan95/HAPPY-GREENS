import { pool } from './src/db';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'src/db/migrations/007_coupon_applicable_items.sql'), 'utf-8');
        await pool.query(sql);
        console.log('Migration 007 applied successfully');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}
migrate();
