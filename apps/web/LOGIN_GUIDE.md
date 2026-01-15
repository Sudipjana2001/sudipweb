# Quick Start Guide - Fix Login & Become Admin

## 🚨 Problem: Cannot Login

**What's happening**: Getting 400 Bad Request errors when trying to sign up or log in.

**Why**: Supabase authentication needs configuration in the dashboard.

---

## ✅ Solution (Choose One)

### Option 1: Fix Supabase Settings (Recommended for Production)

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard
   - Select project: `hpnubjnnzhrivbmayifw`

2. **Disable Email Confirmation** (for testing):
   - Navigate to: **Authentication** → **Providers** → **Email**
   - **UNCHECK** "Confirm email"
   - Click **Save**

3. **Add Site URL**:
   - Go to: **Authentication** → **URL Configuration**
   - **Site URL**: `http://localhost:8080`
   - **Redirect URLs**: Add `http://localhost:8080/*`
   - Click **Save**

4. **Now try to sign up** at http://localhost:8080/signup

---

### Option 2: Create User via SQL (Quick Fix)

If you can't access Supabase dashboard or want to test immediately:

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/hpnubjnnzhrivbmayifw/sql
   - Click **New Query**

2. **Run this SQL**:

```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_sent_at, confirmation_token,
  recovery_token, email_change_token_new, email_change,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@pebric.com',
  crypt('AdminPassword123!', gen_salt('bf')),
  NOW(), NOW(), '', '', '', '',
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  false, NOW()
);

-- Create profile
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT id, email, raw_user_meta_data->>'full_name', NOW(), NOW()
FROM auth.users WHERE email = 'admin@pebric.com';

-- Make admin
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 'admin', NOW()
FROM auth.users WHERE email = 'admin@pebric.com';
```

3. **Login credentials**:
   - Email: `admin@pebric.com`
   - Password: `AdminPassword123!`

---

## 🎯 How to Become Admin

### If You Already Have a User Account:

**Open Supabase SQL Editor** and run:

```sql
-- Replace with YOUR email
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 'admin', NOW()
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

---

## 📋 Quick Feature Overview

Once logged in:

### Regular User Features:
1. **Shop** - Browse and buy products
2. **Pets** - Add pet profiles for size recommendations
3. **Cart** - Manage shopping cart
4. **Orders** - Track your orders
5. **Gallery** - Share photos of you and your pet
6. **Loyalty** - Earn and redeem points
7. **Referrals** - Get rewards for referrals

### Admin-Only Features (requires admin role):
1. **Admin Dashboard** (`/admin`)
   - Manage products
   - View analytics
   - Process orders
   - Dynamic pricing
   - Campaign management
   - Customer support

---

## 🔍 Verify Everything Works

After creating user/admin:

1. ✅ Go to http://localhost:8080/login
2. ✅ Login with credentials
3. ✅ You should be redirected to home page
4. ✅ Click Account icon - should show your name
5. ✅ Go to http://localhost:8080/admin
6. ✅ Should see admin dashboard (if you added admin role)

---

## 🆘 Still Having Issues?

### Cannot See Admin Dashboard:

**Check if admin role exists**:
```sql
SELECT u.email, ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'YOUR_EMAIL';
```

If no role shows, add it:
```sql
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 'admin', NOW()
FROM auth.users
WHERE email = 'YOUR_EMAIL';
```

### Login Still Fails:

1. Check browser console for exact error
2. Verify `.env` file has correct Supabase URL and key
3. Try clearing browser cache and localStorage
4. Restart dev server (`npm run dev`)

---

## 📖 Full Documentation

For complete step-by-step guides for all features, see:
- `implementation_plan.md` - Complete user guide with all features
- `walkthrough.md` - Verification report with test results

---

**Need Help?** Check the console logs in browser (F12) for specific error messages.
