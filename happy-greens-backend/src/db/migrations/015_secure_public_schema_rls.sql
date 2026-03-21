-- Secure public schema tables for Supabase/PostgREST exposure.
-- Strategy:
-- 1. Find every base table in public with RLS disabled.
-- 2. Enable RLS on those tables.
-- 3. Add no public/anon policies.
-- 4. Add only a narrow authenticated INSERT policy for analytics_events.
--
-- Report queries are included at the end for verification after execution.

DO $$
DECLARE
  target RECORD;
BEGIN
  FOR target IN
    SELECT c.relname AS table_name
    FROM pg_class c
    INNER JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.table_name);
    RAISE NOTICE 'Enabled RLS on public.%', target.table_name;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    INNER JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'analytics_events'
      AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'analytics_events'
      AND policyname = 'Allow authenticated insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Allow authenticated insert"
      ON public.analytics_events
      FOR INSERT
      TO authenticated
      WITH CHECK (true)
    $policy$;

    RAISE NOTICE 'Added policy "Allow authenticated insert" on public.analytics_events';
  END IF;
END
$$;

-- Verification / report queries
-- 1. Tables in public with RLS enabled
-- SELECT
--   c.relname AS table_name,
--   c.relrowsecurity AS rls_enabled
-- FROM pg_class c
-- INNER JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
--   AND c.relkind = 'r'
-- ORDER BY c.relname;
--
-- 2. Policies present in public
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
--
-- Critical flows to verify after deployment if they ever move to direct Supabase/PostgREST access:
--   users
--   carts
--   cart_items
--   orders
--   order_items
--   wishlists
--   wishlist_items
--   phone_otps
