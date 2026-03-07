# Phase 6.5 Migration Instructions

Since you're already connected to the `happy_greens` database in psql, follow these steps:

## Step 1: Apply Migration

In your psql session, run:

```sql
\i src/db/migrations/004_operations.sql
```

## Step 2: Verify Tables Created

Run this query to check all Phase 6.5 tables exist:

```sql
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('order_status_history', 'deliveries', 'delivery_status_history', 'coupons', 'coupon_usage')
ORDER BY table_name;
```

**Expected output:** 5 tables listed

## Step 3: Verify Orders Table Columns

```sql
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('coupon_id', 'discount_amount', 'status')
ORDER BY column_name;
```

**Expected output:**
- `coupon_id` (integer)
- `discount_amount` (numeric)
- `status` (character varying)

## Step 4: Verify Triggers

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('orders', 'deliveries')
ORDER BY event_object_table, trigger_name;
```

**Expected triggers:**
- `after_update_order_status` on `orders`
- `after_update_delivery_status` on `deliveries`
- `before_insert_delivery_tracking` on `deliveries`
- `before_update_delivery` on `deliveries`

## Step 5: Test Tracking Number Generation

```sql
-- This should auto-generate a tracking number
INSERT INTO deliveries (order_id, delivery_address, tracking_number)
VALUES (1, '123 Test St', '')
RETURNING tracking_number;
```

**Expected:** Tracking number like `HG20260203123456`

Then delete the test record:
```sql
DELETE FROM deliveries WHERE order_id = 1;
```

## Verification Complete

Once all checks pass, Phase 6.5 database is ready!

**Next:** Backend APIs are already implemented and ready to test.

---

## Quick Verification Script

Or run the entire verification at once:

```bash
psql -U postgres -d happy_greens -f verify-migration-004.sql
```
