-- 1. Duplicate orders by client token or payment intent
SELECT
    client_order_token,
    payment_intent_id,
    COUNT(*) AS duplicate_count
FROM orders
WHERE client_order_token IS NOT NULL
   OR payment_intent_id IS NOT NULL
GROUP BY client_order_token, payment_intent_id
HAVING COUNT(*) > 1;

-- 2. Users with critical null fields
SELECT id, email, full_name, role
FROM users
WHERE email IS NULL
   OR full_name IS NULL
   OR role IS NULL;

-- 3. Orders with critical null fields
SELECT id, user_id, total_amount, status, shipping_address, payment_method
FROM orders
WHERE user_id IS NULL
   OR total_amount IS NULL
   OR status IS NULL
   OR shipping_address IS NULL
   OR payment_method IS NULL;

-- 4. Orphan order items (item exists but parent order is missing)
SELECT oi.id, oi.order_id, oi.product_id
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;

-- 5. Orphan payments (payment exists but order is missing)
SELECT p.id, p.order_id, p.amount, p.status
FROM payments p
LEFT JOIN orders o ON o.id = p.order_id
WHERE o.id IS NULL;

-- 6. Orphan cart rows (cart references user/product that no longer exists)
SELECT c.*
FROM carts c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN products p ON p.id = c.product_id
WHERE u.id IS NULL
   OR p.id IS NULL;
