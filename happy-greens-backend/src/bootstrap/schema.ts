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
