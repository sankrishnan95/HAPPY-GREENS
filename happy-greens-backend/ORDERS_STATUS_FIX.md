# Orders Status Filtering Issue - Quick Fix

## Problem
All tabs in the Orders page show the same data because existing orders don't have the `status` column populated.

## Root Cause
Migration 004 added the `status` column with a default value of `'pending'`, but this only applies to NEW orders. Existing orders have `NULL` or empty status values.

## Solution

### Option 1: Update via psql (Recommended)
Run this in your psql session connected to `happy_greens`:

```sql
-- Check current status distribution
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status;

-- Update all NULL/empty statuses to 'pending'
UPDATE orders 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

-- Verify the update
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status;
```

### Option 2: Create Test Data with Different Statuses
To see the tabs working properly, update some orders to different statuses:

```sql
-- Set some orders to 'delivered' (oldest paid orders)
UPDATE orders 
SET status = 'delivered' 
WHERE id IN (
    SELECT id FROM orders 
    WHERE payment_status = 'paid' 
    ORDER BY created_at ASC 
    LIMIT 3
);

-- Set some to 'shipped'
UPDATE orders 
SET status = 'shipped' 
WHERE id IN (
    SELECT id FROM orders 
    WHERE payment_status = 'paid' 
    AND status = 'pending'
    ORDER BY created_at ASC 
    LIMIT 2
);

-- Set some to 'accepted'
UPDATE orders 
SET status = 'accepted' 
WHERE id IN (
    SELECT id FROM orders 
    WHERE payment_status = 'paid' 
    AND status = 'pending'
    ORDER BY created_at ASC 
    LIMIT 2
);

-- Verify distribution
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;
```

### Option 3: Use the Admin UI
Once orders have any status value, you can use the dropdown in the Orders page to change individual order statuses.

## Verification

After updating statuses, refresh the Orders page and click through the tabs:
- **All** - Should show all orders
- **Pending** - Only pending orders
- **Accepted** - Only accepted orders
- **Shipped** - Only shipped orders
- **Delivered** - Only delivered orders
- **Cancelled** - Only cancelled orders

## API Endpoint
The filtering is done by: `GET /api/admin/orders?status=pending`

The backend correctly filters by status, so once orders have different status values, the tabs will work as expected.
