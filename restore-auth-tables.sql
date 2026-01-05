-- ============================================================================
-- PEBRIC DATABASE RESTORATION SCRIPT (FIXED VERSION)
-- ============================================================================
-- Checks for existence before inserting to avoid constraint errors
-- ============================================================================

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    phone text,
    avatar_url text,
    address text,
    city text,
    postal_code text,
    country text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 3. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Create Trigger to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. CREATE ADMIN USER (Conditional Insert)
-- ============================================================================

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  user_email text := 'admin@pebric.com';
BEGIN
  -- Insert user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
      user_email, crypt('AdminPassword123!', gen_salt('bf')), now(),
      '{"full_name":"Admin User"}', now(), now()
    );
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  END IF;

  -- Insert profile if not exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new_user_id, user_email, 'Admin User');
  END IF;

  -- Insert admin role if not exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = new_user_id AND role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin');
  END IF;
  
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Database restored & Admin user verified!' as status;
