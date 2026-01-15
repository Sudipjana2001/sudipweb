-- ============================================================================
-- ULTIMATE PERMISSION FIX
-- ============================================================================
-- Fixes 500 "Database error querying schema"
-- ============================================================================

BEGIN;

-- 1. Grant Usage on Schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 2. Grant Table Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Fix Search Paths (Aggressive)
-- This tells Supabase where to look for tables
ALTER ROLE authenticator SET search_path = "$user", public, extensions;
ALTER ROLE authenticated SET search_path = "$user", public, extensions;
ALTER ROLE service_role SET search_path = "$user", public, extensions;
ALTER ROLE postgres SET search_path = "$user", public, extensions;

-- 4. Ensure Extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 5. RELOAD CONFIG
NOTIFY pgrst, 'reload config';

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Permissions updated!' as status;
