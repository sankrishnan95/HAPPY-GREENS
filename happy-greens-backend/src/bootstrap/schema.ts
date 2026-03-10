import { pool } from '../db';

export const ensureProductImagesColumn = async (): Promise<void> => {
    await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
    `);

    await pool.query(`
        UPDATE products
        SET images = jsonb_build_array(image_url)
        WHERE (images IS NULL OR images = '[]'::jsonb)
          AND image_url IS NOT NULL
          AND image_url <> ''
    `);

    console.log('[Schema Bootstrap] products.images ensured');
};

export const ensureBannerTextColumns = async (): Promise<void> => {
    await pool.query(`
        ALTER TABLE banners
        ADD COLUMN IF NOT EXISTS subheading VARCHAR(255),
        ADD COLUMN IF NOT EXISTS description TEXT
    `);

    console.log('[Schema Bootstrap] banners.subheading and banners.description ensured');
};

export const ensureAuthColumns = async (): Promise<void> => {
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
        ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10),
        ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP
    `);

    console.log('[Schema Bootstrap] users auth columns ensured');
};

export const ensureOperationsSchema = async (): Promise<void> => {
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_points_earned INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_points_redeemed INTEGER NOT NULL DEFAULT 0
    `);

    await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS points_used INTEGER NOT NULL DEFAULT 0
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS order_status_history (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            old_status VARCHAR(50),
            new_status VARCHAR(50) NOT NULL,
            changed_by INTEGER REFERENCES users(id),
            changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            notes TEXT
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_order_status_history_date ON order_status_history(changed_at)
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS loyalty_transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'reversed', 'adjusted')),
            points INTEGER NOT NULL,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON loyalty_transactions(order_id)
    `);

    await pool.query(`
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check
    `);

    await pool.query(`
        ALTER TABLE orders
        ADD CONSTRAINT orders_status_check
        CHECK (status IN ('pending', 'placed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
    `);

    console.log('[Schema Bootstrap] operations schema ensured');
};

