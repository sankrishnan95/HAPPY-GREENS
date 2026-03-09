import bcrypt from 'bcryptjs';
import { pool } from '../db';

const DEFAULT_ADMIN_EMAIL = 'admin@happygreens.com';
const DEFAULT_ADMIN_PASSWORD = 'admin3012';
const DEFAULT_ADMIN_FULL_NAME = 'Happy Greens Admin';

export const ensureAdminFromEnv = async (): Promise<void> => {
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const adminFullName = process.env.ADMIN_FULL_NAME?.trim() || DEFAULT_ADMIN_FULL_NAME;

    const usingFallback = !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD;
    if (usingFallback) {
        console.warn('[Admin Bootstrap] ADMIN_EMAIL/ADMIN_PASSWORD not set. Using default admin credentials.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [adminEmail]);

    if (existingUser.rows.length === 0) {
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role)
             VALUES ($1, $2, $3, 'admin')`,
            [adminEmail, passwordHash, adminFullName]
        );
        console.log(`[Admin Bootstrap] Admin user created for ${adminEmail}`);
        return;
    }

    await pool.query(
        `UPDATE users
         SET password_hash = $1,
             full_name = $2,
             role = 'admin'
         WHERE id = $3`,
        [passwordHash, adminFullName, existingUser.rows[0].id]
    );

    console.log(`[Admin Bootstrap] Admin credentials synced for ${adminEmail}`);
};
