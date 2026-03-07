-- Quick verification and migration for Phase 6.5
-- Copy and paste this into your psql session

-- First, verify current state
\dt

-- Apply Migration 004
\i src/db/migrations/004_operations.sql

-- Verify new tables created
SELECT 'Verifying Phase 6.5 tables...' AS status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('order_status_history', 'deliveries', 'delivery_status_history', 'coupons', 'coupon_usage') 
        THEN 'CREATED ✓'
        ELSE 'MISSING ✗'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('order_status_history', 'deliveries', 'delivery_status_history', 'coupons', 'coupon_usage')
ORDER BY table_name;

-- Verify orders table has new columns
SELECT 
    column_name,
    data_type,
    'EXISTS ✓' as status
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('coupon_id', 'discount_amount', 'status')
ORDER BY column_name;

-- Count records in new tables
SELECT 'order_status_history' as table_name, COUNT(*) as count FROM order_status_history
UNION ALL
SELECT 'deliveries', COUNT(*) FROM deliveries
UNION ALL
SELECT 'delivery_status_history', COUNT(*) FROM delivery_status_history
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'coupon_usage', COUNT(*) FROM coupon_usage;

-- Show all triggers
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing || ' ' || event_manipulation as trigger_type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

SELECT 'Phase 6.5 Migration Complete!' AS status;
