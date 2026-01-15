-- ============================================================================
-- FIX LOGIN ISSUES
-- ============================================================================

-- 1. Drop trigger (to rule it out as cause of 500 error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Update Admin Password (force re-hash)
UPDATE auth.users
SET encrypted_password = crypt('AdminPassword123!', gen_salt('bf'))
WHERE email = 'admin@pebric.com';

-- 3. Verify User
SELECT id, email, encrypted_password FROM auth.users WHERE email = 'admin@pebric.com';

-- 4. Verify Profile
SELECT id, email, full_name FROM public.profiles WHERE email = 'admin@pebric.com';
