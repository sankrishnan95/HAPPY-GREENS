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
