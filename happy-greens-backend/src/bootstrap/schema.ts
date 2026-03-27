import { pool } from '../db';

export const ensureProductImagesColumn = async (): Promise<void> => {
    await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
    `);

    await pool.query(`
        UPDATE products
        SET is_active = TRUE
        WHERE is_active IS NULL
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

export const ensureMultiUnitSchema = async (): Promise<void> => {
    await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS min_qty DECIMAL(10, 3) DEFAULT 1,
        ADD COLUMN IF NOT EXISTS step_qty DECIMAL(10, 3) DEFAULT 1
    `);

    await pool.query(`
        ALTER TABLE cart_items
        ADD COLUMN IF NOT EXISTS unit VARCHAR(20)
    `);

    await pool.query(`
        ALTER TABLE order_items
        ADD COLUMN IF NOT EXISTS unit VARCHAR(20)
    `);

    await pool.query(`
        ALTER TABLE cart_items
        ALTER COLUMN quantity TYPE DECIMAL(10, 3)
        USING quantity::DECIMAL(10, 3)
    `);

    await pool.query(`
        ALTER TABLE order_items
        ALTER COLUMN quantity TYPE DECIMAL(10, 3)
        USING quantity::DECIMAL(10, 3)
    `);

    await pool.query(`
        UPDATE products
        SET unit = CASE
            WHEN UPPER(COALESCE(unit, '')) IN ('G', 'GRAM', 'GRAMS', 'KG', 'KILOGRAM') THEN 'GRAM'
            WHEN UPPER(COALESCE(unit, '')) IN ('L', 'LT', 'LITRE', 'LITER', 'LITRES', 'LITERS') THEN 'LITRE'
            WHEN UPPER(COALESCE(unit, '')) IN ('DOZEN', 'DOZ') THEN 'DOZEN'
            ELSE 'PIECE'
        END
    `);

    await pool.query(`
        UPDATE products
        SET price_per_unit = COALESCE(price_per_unit, price),
            min_qty = COALESCE(min_qty, 1),
            step_qty = COALESCE(step_qty, 1)
    `);

    await pool.query(`
        ALTER TABLE products
        ALTER COLUMN unit SET DEFAULT 'PIECE'
    `);

    await pool.query(`
        UPDATE cart_items ci
        SET unit = COALESCE(ci.unit, p.unit, 'PIECE')
        FROM products p
        WHERE p.id = ci.product_id
    `);

    await pool.query(`
        UPDATE order_items oi
        SET unit = COALESCE(oi.unit, p.unit, 'PIECE')
        FROM products p
        WHERE p.id = oi.product_id
    `);

    console.log('[Schema Bootstrap] multi-unit product schema ensured');
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
        ADD COLUMN IF NOT EXISTS points_used INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS client_order_token VARCHAR(64)
    `);

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_order_token
        ON orders(user_id, client_order_token)
        WHERE client_order_token IS NOT NULL
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
        CHECK (status IN ('pending', 'placed', 'accepted', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
    `);

    console.log('[Schema Bootstrap] operations schema ensured');
};

export const ensureAnalyticsSchema = async (): Promise<void> => {
    await pool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_type TEXT NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
            page TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
        ON analytics_events(event_type)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
        ON analytics_events(created_at)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id
        ON analytics_events(product_id)
    `);

    console.log('[Schema Bootstrap] analytics schema ensured');
};

export const ensureCategoriesAndProductCategoryBackfill = async (): Promise<void> => {
    await pool.query(`
        INSERT INTO categories (name, slug, description)
        SELECT seed.name, seed.slug, seed.description
        FROM (
            VALUES
                ('Fruits', 'fruits', 'Fresh seasonal fruits'),
                ('Vegetables', 'vegetables', 'Farm fresh vegetables'),
                ('Dairy', 'dairy', 'Milk, cheese and dairy products'),
                ('Staples', 'staples', 'Daily staple foods'),
                ('Snacks', 'snacks', 'Ready-to-eat snacks'),
                ('Beverages', 'beverages', 'Juices and drinks'),
                ('Flowers', 'flowers', 'Fresh flowers and floral bundles'),
                ('Laundromat', 'laundromat', 'Laundry essentials and fabric care'),
                ('Personal Care', 'personal-care', 'Bath, body and personal care products')
        ) AS seed(name, slug, description)
        ON CONFLICT (slug) DO NOTHING
    `);

    const categoryResult = await pool.query('SELECT id, slug FROM categories');
    const categoryIdBySlug = new Map<string, number>(
        categoryResult.rows.map((row: any) => [String(row.slug), Number(row.id)])
    );

    const keywordMap: Record<string, string[]> = {
        fruits: ['apple', 'banana', 'orange', 'mango', 'grape', 'pomegranate', 'papaya', 'watermelon', 'melon'],
        vegetables: ['tomato', 'potato', 'onion', 'spinach', 'carrot', 'cabbage', 'cauliflower', 'broccoli', 'pepper', 'capsicum'],
        dairy: ['milk', 'cheese', 'paneer', 'butter', 'yogurt', 'curd'],
        staples: ['rice', 'flour', 'dal', 'sugar', 'salt', 'wheat'],
        snacks: ['chips', 'biscuit', 'chocolate', 'popcorn', 'nuts'],
        beverages: ['juice', 'tea', 'coffee', 'soda', 'water'],
        flowers: ['flower', 'rose', 'bouquet', 'dahlia', 'lily', 'jasmine', 'marigold'],
        laundromat: ['detergent', 'softener', 'laundry', 'fabric wash', 'washing powder', 'stain remover'],
        'personal-care': ['shampoo', 'soap', 'face wash', 'body wash', 'toothpaste', 'lotion', 'conditioner', 'sanitizer']
    };

    for (const [slug, keywords] of Object.entries(keywordMap)) {
        const categoryId = categoryIdBySlug.get(slug);
        if (!categoryId) continue;

        const likePatterns = keywords.map((keyword) => `%${keyword}%`);
        await pool.query(
            `UPDATE products
             SET category_id = $1, updated_at = NOW()
             WHERE category_id IS NULL
               AND LOWER(name) LIKE ANY($2::text[])`,
            [categoryId, likePatterns]
        );
    }

    const unassigned = await pool.query('SELECT COUNT(*)::int AS count FROM products WHERE category_id IS NULL');
    console.log(`[Schema Bootstrap] categories ensured and product category backfill done (unassigned: ${unassigned.rows[0]?.count ?? 0})`);
};
