-- Migration 003: Power BI Views
-- Creates SQL views for business intelligence and reporting

-- ============================================
-- View 1: bi_sales
-- Sales data with order, customer, and payment information
-- ============================================
CREATE OR REPLACE VIEW bi_sales AS
SELECT 
    o.id AS order_id,
    o.created_at AS order_date,
    o.user_id AS customer_id,
    o.total_amount,
    COALESCE(p.amount, 0) AS payment_amount,
    COALESCE(
        (SELECT SUM(oi.quantity * oi.price_at_purchase) 
         FROM order_items oi 
         WHERE oi.order_id = o.id), 
        0
    ) AS product_revenue,
    CASE 
        WHEN p.payment_status = 'succeeded' THEN 'paid'
        WHEN p.payment_status IS NULL AND o.status = 'paid' THEN 'paid'
        WHEN o.status = 'pending' THEN 'pending'
        ELSE 'unpaid'
    END AS payment_status
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id AND p.payment_status = 'succeeded';

-- ============================================
-- View 2: bi_products
-- Product performance with sales and revenue metrics
-- ============================================
CREATE OR REPLACE VIEW bi_products AS
SELECT 
    p.id AS product_id,
    p.name,
    c.name AS category,
    p.price,
    p.stock_quantity,
    COALESCE(
        (SELECT SUM(oi.quantity) 
         FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id 
         WHERE oi.product_id = p.id AND o.status = 'paid'), 
        0
    ) AS total_sold,
    COALESCE(
        (SELECT SUM(oi.quantity * oi.price_at_purchase) 
         FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id 
         WHERE oi.product_id = p.id AND o.status = 'paid'), 
        0
    ) AS total_revenue
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_deleted = false;

-- ============================================
-- View 3: bi_customers
-- Customer profiles with lifetime value and activity
-- ============================================
CREATE OR REPLACE VIEW bi_customers AS
SELECT 
    u.id AS customer_id,
    u.full_name AS name,
    u.email,
    COALESCE(
        (SELECT COUNT(*) 
         FROM orders o 
         WHERE o.user_id = u.id), 
        0
    ) AS total_orders,
    COALESCE(
        (SELECT SUM(o.total_amount) 
         FROM orders o 
         WHERE o.user_id = u.id AND o.status = 'paid'), 
        0
    ) AS total_spent,
    (SELECT MAX(o.created_at) 
     FROM orders o 
     WHERE o.user_id = u.id) AS last_order_date
FROM users u
WHERE u.role = 'customer';

-- ============================================
-- View 4: bi_inventory
-- Inventory management with stock levels and sales velocity
-- ============================================
CREATE OR REPLACE VIEW bi_inventory AS
SELECT 
    p.id AS product_id,
    p.name,
    p.stock_quantity,
    COALESCE(
        (SELECT SUM(oi.quantity) / NULLIF(COUNT(DISTINCT DATE(o.created_at)), 0)
         FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id 
         WHERE oi.product_id = p.id 
           AND o.status = 'paid'
           AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'), 
        0
    ) AS avg_daily_sales,
    CASE 
        WHEN COALESCE(
            (SELECT SUM(oi.quantity) / NULLIF(COUNT(DISTINCT DATE(o.created_at)), 0)
             FROM order_items oi 
             JOIN orders o ON oi.order_id = o.id 
             WHERE oi.product_id = p.id 
               AND o.status = 'paid'
               AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'), 
            0
        ) > 0 
        THEN ROUND(p.stock_quantity / 
            (SELECT SUM(oi.quantity) / NULLIF(COUNT(DISTINCT DATE(o.created_at)), 0)
             FROM order_items oi 
             JOIN orders o ON oi.order_id = o.id 
             WHERE oi.product_id = p.id 
               AND o.status = 'paid'
               AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'))
        ELSE 999
    END AS days_of_stock_left
FROM products p
WHERE p.is_deleted = false;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON VIEW bi_sales IS 'Sales data for Power BI reporting with order, customer, and payment information';
COMMENT ON VIEW bi_products IS 'Product performance metrics including sales and revenue';
COMMENT ON VIEW bi_customers IS 'Customer profiles with lifetime value and purchase history';
COMMENT ON VIEW bi_inventory IS 'Inventory management with stock levels and sales velocity (30-day average)';

-- ============================================
-- Grant permissions (optional - adjust as needed)
-- ============================================

-- Grant SELECT to application user (replace 'app_user' with your actual user)
-- GRANT SELECT ON bi_sales TO app_user;
-- GRANT SELECT ON bi_products TO app_user;
-- GRANT SELECT ON bi_customers TO app_user;
-- GRANT SELECT ON bi_inventory TO app_user;
