import { Pool } from 'pg';
import dotenv from 'dotenv';
import { captureBackendException } from '../lib/sentry';
import { logError } from '../lib/logger';

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    captureBackendException(err, { scope: 'pg_idle_client' });
    logError('Unexpected error on idle client', err);
    process.exit(-1);
});
