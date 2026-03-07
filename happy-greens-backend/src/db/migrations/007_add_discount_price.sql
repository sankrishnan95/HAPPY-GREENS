-- =====================================================
-- ADD DISCOUNT PRICE TO PRODUCTS
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2) CHECK (discount_price >= 0);
