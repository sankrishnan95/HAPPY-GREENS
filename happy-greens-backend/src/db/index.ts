import { Pool } from 'pg';
import dotenv from 'dotenv';
import { captureBackendException } from '../lib/sentry';
import { logError } from '../lib/logger';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 1000,
    max: 3,
    keepAlive: false,
    allowExitOnIdle: true
});

pool.on('connect', () => {
    console.log('[DB] Successfully connected to PostgreSQL pool');
});

pool.on('error', (err) => {
    captureBackendException(err, { scope: 'pg_idle_client' });
    logError('Unexpected error on idle client', err);
});
