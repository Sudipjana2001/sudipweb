-- ============================================================================
-- SIMPLIFIED USER CREATION SCRIPT (No migrations required)
-- ============================================================================
-- This creates ONLY the auth user, skipping profile and roles tables
-- Use this if migrations haven't been run yet
-- ============================================================================

-- Create a user account in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@pebric.com',                          -- ✏️ CHANGE THIS
  crypt('AdminPassword123!', gen_salt('bf')),  -- ✏️ CHANGE PASSWORD
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',                -- ✏️ CHANGE NAME
  false
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICATION: Check if user was created
-- ============================================================================
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'admin@pebric.com';

-- ============================================================================
-- LOGIN CREDENTIALS:
-- Email: admin@pebric.com
-- Password: AdminPassword123!
-- ============================================================================

-- NOTE: You won't have admin privileges or profile data until you run
-- the database migrations. But you can LOGIN with these credentials.
