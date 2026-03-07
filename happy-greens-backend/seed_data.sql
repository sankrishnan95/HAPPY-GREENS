-- Seed script for Happy Greens Database
-- Run with: psql -U postgres -d happy_greens -f seed_data.sql

-- Clear existing data
TRUNCATE TABLE payments, order_items, orders, cart_items, carts, products, categories, users RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (name, slug, image_url) VALUES
('Fruits', 'fruits', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=60'),
('Vegetables', 'vegetables', 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=500&q=60'),
('Dairy', 'dairy', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=60'),
('Staples', 'staples', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60'),
('Snacks', 'snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=500&q=60'),
('Beverages', 'beverages', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60');

-- Insert products
INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, is_featured) VALUES
-- Fruits (category_id = 1)
('Fresh Apple', 'Fresh Fresh Apple from Happy Greens.', 120, 100, 1, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=60', true),
('Banana Robusta', 'Fresh Banana Robusta from Happy Greens.', 40, 150, 1, 'https://images.unsplash.com/photo-1571771896612-610175226155?auto=format&fit=crop&w=500&q=60', false),
('Pomegranate', 'Fresh Pomegranate from Happy Greens.', 180, 80, 1, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=60', false),
('Orange', 'Fresh Orange from Happy Greens.', 80, 120, 1, 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=500&q=60', false),
('Grapes Black', 'Fresh Grapes Black from Happy Greens.', 90, 60, 1, 'https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=500&q=60', false),
-- Vegetables (category_id = 2)
('Potato', 'Fresh Potato from Happy Greens.', 30, 200, 2, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=60', false),
('Onion', 'Fresh Onion from Happy Greens.', 40, 180, 2, 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=500&q=60', false),
('Tomato', 'Fresh Tomato from Happy Greens.', 25, 150, 2, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=60', true),
('Spinach', 'Fresh Spinach from Happy Greens.', 20, 50, 2, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=60', false),
('Carrot', 'Fresh Carrot from Happy Greens.', 50, 90, 2, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=60', false),
-- Dairy (category_id = 3)
('Fresh Milk', 'Fresh Fresh Milk from Happy Greens.', 60, 50, 3, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=60', true),
('Butter', 'Fresh Butter from Happy Greens.', 250, 40, 3, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=60', false),
('Cheese Slices', 'Fresh Cheese Slices from Happy Greens.', 150, 60, 3, 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=500&q=60', false),
('Yogurt', 'Fresh Yogurt from Happy Greens.', 40, 80, 3, 'https://images.unsplash.com/photo-1562114808-b4b33cf60f4f?auto=format&fit=crop&w=500&q=60', false),
('Paneer', 'Fresh Paneer from Happy Greens.', 300, 30, 3, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=60', false),
-- Staples (category_id = 4)
('Basmati Rice', 'Fresh Basmati Rice from Happy Greens.', 150, 100, 4, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60', false),
('Wheat Flour', 'Fresh Wheat Flour from Happy Greens.', 45, 120, 4, 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=500&q=60', false),
('Toor Dal', 'Fresh Toor Dal from Happy Greens.', 110, 80, 4, 'https://images.unsplash.com/photo-1585996687439-54e26cd2e10c?auto=format&fit=crop&w=500&q=60', false),
('Sugar', 'Fresh Sugar from Happy Greens.', 42, 150, 4, 'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=500&q=60', false),
('Salt', 'Fresh Salt from Happy Greens.', 20, 200, 4, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=500&q=60', false),
-- Snacks (category_id = 5)
('Potato Chips', 'Fresh Potato Chips from Happy Greens.', 30, 100, 5, 'https://images.unsplash.com/photo-1566478919030-26d9c2865e3d?auto=format&fit=crop&w=500&q=60', false),
('Biscuits', 'Fresh Biscuits from Happy Greens.', 20, 150, 5, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=60', false),
('Nuts Mix', 'Fresh Nuts Mix from Happy Greens.', 400, 40, 5, 'https://images.unsplash.com/photo-1605193721643-754d38995530?auto=format&fit=crop&w=500&q=60', false),
('Popcorn', 'Fresh Popcorn from Happy Greens.', 50, 80, 5, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=60', false),
('Chocolate Bar', 'Fresh Chocolate Bar from Happy Greens.', 60, 100, 5, 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=500&q=60', false),
-- Beverages (category_id = 6)
('Orange Juice', 'Fresh Orange Juice from Happy Greens.', 120, 60, 6, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60', false),
('Green Tea', 'Fresh Green Tea from Happy Greens.', 250, 50, 6, 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=500&q=60', false),
('Coffee Powder', 'Fresh Coffee Powder from Happy Greens.', 300, 40, 6, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=60', false),
('Soda Can', 'Fresh Soda Can from Happy Greens.', 40, 100, 6, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60', false),
('Mineral Water', 'Fresh Mineral Water from Happy Greens.', 20, 200, 6, 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=500&q=60', false);

-- Insert admin user (password: admin123)
-- Hash generated with bcrypt, rounds=10
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@happygreens.com', '$2a$10$YourHashHere', 'Admin User', 'admin');

-- Insert test customer (password: customer123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('customer@test.com', '$2a$10$YourHashHere', 'John Doe', 'customer');

-- Insert test order
INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES
(2, 500.00, 'paid', 'razorpay');

-- Insert order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES
(1, 1, 'Fresh Apple', 2, 120),
(1, 11, 'Fresh Milk', 1, 60),
(1, 7, 'Onion', 3, 40),
(1, 8, 'Tomato', 2, 25),
(1, 16, 'Basmati Rice', 1, 150);

-- Insert payment record
INSERT INTO payments (order_id, user_id, amount, currency, payment_gateway, payment_status, gateway_payment_id, gateway_order_id, payment_method_type, metadata)
VALUES (1, 2, 500.00, 'INR', 'razorpay', 'succeeded', 'pay_test_1234567890', 'order_test_1234567890', 'UPI', '{"test": true}');

-- Display summary
SELECT 'Seeding completed!' AS status;
SELECT COUNT(*) AS categories FROM categories;
SELECT COUNT(*) AS products FROM products;
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS orders FROM orders;
SELECT COUNT(*) AS payments FROM payments;
