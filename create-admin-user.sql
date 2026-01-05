-- ============================================================================
-- PEBRIC USER CREATION & ADMIN SETUP SCRIPT
-- ============================================================================
-- This script creates a user account and assigns admin role
-- Run this in Supabase SQL Editor if you're having login issues
-- ============================================================================

-- STEP 1: Create a user account bypassing email confirmation
-- This creates a user in the auth.users table directly
-- ============================================================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@pebric.com',                          -- ✏️ CHANGE THIS EMAIL
  crypt('AdminPassword123!', gen_salt('bf')),  -- ✏️ CHANGE THIS PASSWORD
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',                -- ✏️ CHANGE THIS NAME
  false,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- STEP 2: Create profile for the user
-- This creates a record in the public.profiles table
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@pebric.com'              -- ✏️ MATCH THIS WITH STEP 1
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Assign admin role to the user
-- This inserts a record in the user_roles table
-- ============================================================================

INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  id,
  'admin',
  NOW()
FROM auth.users
WHERE email = 'admin@pebric.com'              -- ✏️ MATCH THIS WITH STEP 1
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the user was created successfully
-- ============================================================================

-- Verify user exists
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
WHERE email = 'admin@pebric.com';

-- Verify profile exists
SELECT *
FROM public.profiles
WHERE email = 'admin@pebric.com';

-- Verify admin role assigned
SELECT 
  ur.user_id,
  ur.role,
  u.email,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'admin@pebric.com';

-- ============================================================================
-- LOGIN CREDENTIALS (After running this script):
-- ============================================================================
-- Email: admin@pebric.com
-- Password: AdminPassword123!
-- ============================================================================

-- ============================================================================
-- TO CREATE ADDITIONAL USERS:
-- ============================================================================
-- Simply copy STEP 1-3 and change the email, password, and name
-- Example:
/*
INSERT INTO auth.users (...) VALUES (
  ...
  'user2@pebric.com',
  crypt('UserPassword123!', gen_salt('bf')),
  ...
  '{"full_name":"Regular User"}',
  ...
);
*/

-- ============================================================================
-- TO MAKE AN EXISTING USER ADMIN:
-- ============================================================================
-- If you already have a user and just want to make them admin:
/*
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 'admin', NOW()
FROM auth.users
WHERE email = 'existing.user@email.com'
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- ============================================================================
-- TO REMOVE ADMIN ROLE:
-- ============================================================================
/*
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@email.com')
AND role = 'admin';
*/
