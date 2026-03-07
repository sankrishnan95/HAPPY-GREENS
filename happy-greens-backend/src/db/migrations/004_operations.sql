-- Migration 004: Order & Delivery Operations
-- Phase 6.5: Add order status management, delivery tracking, and discount coupons

-- ============================================
-- 1. ORDER STATUS MANAGEMENT
-- ============================================

-- Add status column to orders table if not exists
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Create order status history table for audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  notes TEXT,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_date ON order_status_history(changed_at);

-- ============================================
-- 2. DELIVERY TRACKING SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(50) UNIQUE NOT NULL,
  delivery_status VARCHAR(30) NOT NULL DEFAULT 'pickup_pending',
  courier_name VARCHAR(100),
  courier_contact VARCHAR(20),
  pickup_address TEXT,
  delivery_address TEXT NOT NULL,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_tracking ON deliveries(tracking_number);
CREATE INDEX idx_deliveries_status ON deliveries(delivery_status);

-- Delivery status history for audit trail
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  notes TEXT,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delivery_status_history_delivery ON delivery_status_history(delivery_id);

-- ============================================
-- 3. DISCOUNT COUPONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (valid_until > valid_from)
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_order ON coupon_usage(order_id);

-- ============================================
-- 4. ADD DISCOUNT FIELDS TO ORDERS
-- ============================================

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- ============================================
-- 5. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to generate unique tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_tracking VARCHAR(50);
  exists_check INTEGER;
BEGIN
  LOOP
    new_tracking := 'HG' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_check FROM deliveries WHERE tracking_number = new_tracking;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN new_tracking;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking number if not provided
CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := generate_tracking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_delivery_tracking
  BEFORE INSERT ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_number();

-- Trigger to update deliveries.updated_at
CREATE OR REPLACE FUNCTION update_delivery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_delivery
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_timestamp();

-- Trigger to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_update_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Trigger to log delivery status changes
CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
    INSERT INTO delivery_status_history (delivery_id, old_status, new_status)
    VALUES (NEW.id, OLD.delivery_status, NEW.delivery_status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_update_delivery_status
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables created
SELECT 'Migration 004 completed successfully' AS status;
SELECT COUNT(*) AS order_status_history_count FROM order_status_history;
SELECT COUNT(*) AS deliveries_count FROM deliveries;
SELECT COUNT(*) AS coupons_count FROM coupons;
