import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations';

interface Migration {
    id: number;
    filename: string;
    executed_at: Date;
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
    const query = `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
    console.log(`✓ Migrations tracking table ready`);
}

/**
 * Get list of already executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
    const result = await pool.query<Migration>(
        `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`
    );
    return result.rows.map(row => row.filename);
}

/**
 * Get list of migration files from migrations directory
 */
function getMigrationFiles(): string[] {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure migrations run in order

    return files;
}

/**
 * Execute a single migration file
 */
async function executeMigration(filename: string): Promise<void> {
    const migrationsDir = path.join(__dirname, 'migrations');
    const filePath = path.join(migrationsDir, filename);
    
    console.log(`\n→ Running migration: ${filename}`);
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Execute the migration SQL
        await client.query(sql);
        
        // Record the migration
        await client.query(
            `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
            [filename]
        );
        
        await client.query('COMMIT');
        console.log(`✓ Migration completed: ${filename}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed: ${filename}`);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
    console.log('='.repeat(60));
    console.log('Happy Greens Database Migration Runner');
    console.log('='.repeat(60));
    
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✓ Database connection established');
        
        // Create migrations tracking table
        await createMigrationsTable();
        
        // Get executed and pending migrations
        const executedMigrations = await getExecutedMigrations();
        const allMigrations = getMigrationFiles();
        const pendingMigrations = allMigrations.filter(
            migration => !executedMigrations.includes(migration)
        );
        
        console.log(`\nMigration Status:`);
        console.log(`  Total migrations: ${allMigrations.length}`);
        console.log(`  Executed: ${executedMigrations.length}`);
        console.log(`  Pending: ${pendingMigrations.length}`);
        
        if (pendingMigrations.length === 0) {
            console.log('\n✓ All migrations are up to date!');
            return;
        }
        
        console.log('\nPending migrations:');
        pendingMigrations.forEach(migration => {
            console.log(`  - ${migration}`);
        });
        
        // Execute pending migrations
        console.log('\n' + '='.repeat(60));
        console.log('Executing Migrations');
        console.log('='.repeat(60));
        
        for (const migration of pendingMigrations) {
            await executeMigration(migration);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✓ All migrations completed successfully!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ Migration Error');
        console.error('='.repeat(60));
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

/**
 * Show migration status without executing
 */
async function showStatus(): Promise<void> {
    console.log('='.repeat(60));
    console.log('Migration Status');
    console.log('='.repeat(60));
    
    try {
        await pool.query('SELECT NOW()');
        console.log('✓ Database connection established\n');
        
        await createMigrationsTable();
        
        const executedMigrations = await getExecutedMigrations();
        const allMigrations = getMigrationFiles();
        
        console.log('Executed migrations:');
        if (executedMigrations.length === 0) {
            console.log('  (none)');
        } else {
            executedMigrations.forEach(migration => {
                console.log(`  ✓ ${migration}`);
            });
        }
        
        const pendingMigrations = allMigrations.filter(
            migration => !executedMigrations.includes(migration)
        );
        
        console.log('\nPending migrations:');
        if (pendingMigrations.length === 0) {
            console.log('  (none)');
        } else {
            pendingMigrations.forEach(migration => {
                console.log(`  → ${migration}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Main execution
const command = process.argv[2];

if (command === 'status') {
    showStatus();
} else {
    runMigrations();
}
