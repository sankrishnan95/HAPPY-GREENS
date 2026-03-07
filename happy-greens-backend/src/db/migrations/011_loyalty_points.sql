-- ============================================================
-- Migration 011: Loyalty Points System
-- ============================================================

-- 1. Add loyalty columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS loyalty_points       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_earned  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_redeemed INTEGER NOT NULL DEFAULT 0;

-- 2. Add points columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_used   INTEGER NOT NULL DEFAULT 0;

-- 3. Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'reversed')),
  points      INTEGER NOT NULL,  -- positive for earned/reversed, negative for redeemed
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
