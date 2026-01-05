-- ============================================================================
-- FINALIZE ADMIN SETUP
-- ============================================================================
-- 1. Make the new API-created user an Admin
-- 2. Ensure their profile is set up correctly
-- ============================================================================

-- Assign Admin Role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@pebric.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure Profile Exists (just in case trigger missed it)
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Admin User')
FROM auth.users
WHERE email = 'admin@pebric.com'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 
  u.email,
  p.full_name,
  ur.role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@pebric.com';
