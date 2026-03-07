-- Update existing orders to have proper status values
-- Run this to populate status for existing orders

-- Set all existing orders without status to 'pending'
UPDATE orders 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

-- Optionally, set some orders to different statuses for testing
-- Update paid orders to 'delivered' status
UPDATE orders 
SET status = 'delivered' 
WHERE payment_status = 'paid' 
AND created_at < NOW() - INTERVAL '2 days';

-- Set some recent paid orders to 'shipped'
UPDATE orders 
SET status = 'shipped' 
WHERE payment_status = 'paid' 
AND created_at >= NOW() - INTERVAL '2 days'
AND created_at < NOW() - INTERVAL '1 day';

-- Set some to 'accepted'
UPDATE orders 
SET status = 'accepted' 
WHERE payment_status = 'paid' 
AND created_at >= NOW() - INTERVAL '1 day';

-- Verify the distribution
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;
