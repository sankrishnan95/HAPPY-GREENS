import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigrateBanners() {
    const client = await pool.connect();
    try {
        const migrationPath = path.join(__dirname, 'src/db/migrations/010_create_banners_table.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running banners migration...');
        await client.query(sql);
        console.log('Banners migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrateBanners();
