-- =====================================================
-- Happy Greens E-commerce Database Schema
-- Migration 005: Add 'placed' status to orders
-- =====================================================

-- For PostgreSQL < 12 we can't easily alter enum constraints in place safely for existing data in all situations, 
-- but since 'status' is a VARCHAR with a CHECK constraint instead of an ENUM type in the schema, we can alter the constraint.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'placed', 'accepted', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));
