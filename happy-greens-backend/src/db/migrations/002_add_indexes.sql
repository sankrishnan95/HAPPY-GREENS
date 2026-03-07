-- =====================================================
-- Happy Greens E-commerce Database Indexes
-- Migration 002: Performance Indexes
-- =====================================================

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================

-- Email lookup for authentication (already unique, but explicit index)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Role-based queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- User creation date for analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- =====================================================
-- CATEGORIES TABLE INDEXES
-- =====================================================

-- Slug lookup for category pages
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================
-- PRODUCTS TABLE INDEXES
-- =====================================================

-- Category filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Active products only (exclude soft-deleted)
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);

-- Featured products for homepage
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;

-- Price sorting and filtering
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Stock availability checks
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);

-- Product search by name
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Composite index for common query pattern (active products by category)
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_deleted, created_at DESC);

-- Recent products
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- =====================================================
-- CARTS TABLE INDEXES
-- =====================================================

-- User cart lookup (already unique, but explicit index)
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- =====================================================
-- CART_ITEMS TABLE INDEXES
-- =====================================================

-- Cart items lookup
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Product in cart lookup
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);


-- =====================================================
-- ORDERS TABLE INDEXES
-- =====================================================

-- User orders lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Order status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Payment method analytics
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Payment intent tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);

-- Order date for analytics and sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Composite index for user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Composite index for admin dashboard (status + date)
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- =====================================================
-- ORDER_ITEMS TABLE INDEXES
-- =====================================================

-- Order items lookup
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Product sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Composite index for product sales by date
CREATE INDEX IF NOT EXISTS idx_order_items_product_created ON order_items(product_id, created_at DESC);

-- =====================================================
-- PAYMENTS TABLE INDEXES
-- =====================================================

-- Order payment lookup
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- User payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Payment status filtering
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);

-- Payment gateway analytics
CREATE INDEX IF NOT EXISTS idx_payments_payment_gateway ON payments(payment_gateway);

-- Gateway payment ID lookup (webhook verification)
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);

-- Gateway order ID lookup (webhook verification)
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id);

-- Payment date for analytics
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Composite index for successful payments analytics
CREATE INDEX IF NOT EXISTS idx_payments_success_analytics ON payments(payment_status, payment_gateway, created_at DESC) 
    WHERE payment_status = 'succeeded';

-- =====================================================
-- ENABLE TRIGRAM EXTENSION FOR TEXT SEARCH
-- =====================================================

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ANALYZE TABLES
-- =====================================================

-- Update statistics for query planner
ANALYZE users;
ANALYZE categories;
ANALYZE products;
ANALYZE carts;
ANALYZE cart_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;
