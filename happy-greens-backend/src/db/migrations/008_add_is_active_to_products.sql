-- Migration to add is_active to products
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
