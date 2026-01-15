-- ============================================================================
-- FIX DATABASE PERMISSIONS & EXTENSIONS
-- ============================================================================
-- Fixes "Database error querying schema" (500 Error)
-- ============================================================================

-- 1. Ensure Extensions Exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- 2. Grant Usage on Public Schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Grant Table Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Fix Search Path (Crucial for function calls)
ALTER ROLE authenticated SET search_path = "$user", public, extensions;
ALTER ROLE service_role SET search_path = "$user", public, extensions;

-- 5. Force Refresh Schema Cache (by notifying PostgREST)
NOTIFY pgrst, 'reload config';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Permissions fixed & Schema cache reloaded' as status;
