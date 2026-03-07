-- Migration to add images array to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Backfill existing images
UPDATE products SET images = jsonb_build_array(image_url) WHERE image_url IS NOT NULL AND image_url != '';
