ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS original_price_at_purchase DECIMAL(10, 2);
