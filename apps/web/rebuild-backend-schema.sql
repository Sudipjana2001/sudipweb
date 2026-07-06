-- ============================================================================
-- PEBRIC CONSOLIDATED DATABASE REBUILD SCRIPT
-- ============================================================================
-- Rebuilds all tables, enums, indexes, functions, triggers, storage buckets,
-- and RLS policies for a brand new Supabase project.
-- NOTE: Product catalog data is left empty.
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Create Custom Enums & Roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles and User Roles
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Auth Sign Up Triggers
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create Core Helper Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Core Store Infrastructure (No Seed Data)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.occasion_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    image_url text,
    images text[] DEFAULT '{}'::text[],
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
    sizes text[] DEFAULT '{}'::text[],
    pet_sizes text[] DEFAULT '{}'::text[],
    features text[] DEFAULT '{}'::text[],
    stock integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_best_seller boolean DEFAULT false,
    is_new_arrival boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    fabric_type text,
    breathability integer CHECK (breathability >= 1 AND breathability <= 5),
    stretch_level integer CHECK (stretch_level >= 1 AND stretch_level <= 5),
    is_allergy_safe boolean DEFAULT false,
    care_wash text,
    care_dry text,
    durability_rating integer CHECK (durability_rating >= 1 AND durability_rating <= 5),
    seasonal_tags text[] DEFAULT '{}'::text[],
    matching_human_product_id uuid,
    low_stock_threshold integer DEFAULT 10,
    matching_outfit_description text
);

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number text DEFAULT ''::text NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status,
    subtotal numeric(10,2) NOT NULL,
    shipping_cost numeric(10,2) DEFAULT 0,
    tax numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    shipping_address jsonb,
    billing_address jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tracking_number text,
    carrier text,
    gift_wrap boolean DEFAULT false,
    gift_message text,
    gift_wrap_price numeric DEFAULT 0,
    delivery_slot_id uuid,
    payment_method text DEFAULT 'cod'::text,
    payment_status text DEFAULT 'pending'::text,
    payment_id text,
    refund_status text,
    refund_amount numeric DEFAULT 0,
    refund_processed_at timestamp with time zone,
    cod_collected boolean DEFAULT false,
    cod_collected_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    product_image text,
    quantity integer NOT NULL,
    size text,
    pet_size text,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Core RLS Security Enablement
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Core RLS Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read categories') THEN
        CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read collections') THEN
        CREATE POLICY "Public read collections" ON public.collections FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read occasion_tags') THEN
        CREATE POLICY "Public read occasion_tags" ON public.occasion_tags FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read products') THEN
        CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all categories') THEN
        CREATE POLICY "Admin all categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all collections') THEN
        CREATE POLICY "Admin all collections" ON public.collections FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all occasion_tags') THEN
        CREATE POLICY "Admin all occasion_tags" ON public.occasion_tags FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all products') THEN
        CREATE POLICY "Admin all products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    END IF;
END $$;


-- 7. Live Chat Schema (Reconstructed from codebase usage)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    chat_session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type text NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own messages' AND tablename = 'chat_messages') THEN
        CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = chat_session_id AND user_id = auth.uid()));
    END IF;
END $$;


-- 8. Extended Application Features Schema
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    session_id text,
    email text,
    cart_items jsonb DEFAULT '[]'::jsonb,
    cart_total numeric DEFAULT 0,
    abandoned_at timestamp with time zone DEFAULT now(),
    recovered_at timestamp with time zone,
    recovery_email_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    event_type text NOT NULL,
    event_data jsonb,
    user_id uuid,
    session_id text,
    page_url text,
    referrer text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    table_name text,
    record_id uuid,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    user_id uuid REFERENCES auth.users(id),
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    campaign_type text NOT NULL,
    status text DEFAULT 'draft',
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    budget numeric,
    target_audience jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    description text,
    discount_type text NOT NULL,
    discount_value numeric NOT NULL,
    min_order_amount numeric DEFAULT 0,
    max_uses integer,
    uses_count integer DEFAULT 0,
    max_uses_per_user integer DEFAULT 1,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    applies_to text,
    applies_to_ids text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    time_slot text NOT NULL,
    max_orders integer DEFAULT 10,
    current_orders integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dynamic_pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    rule_type text NOT NULL,
    priority integer DEFAULT 0,
    discount_type text NOT NULL,
    discount_value numeric NOT NULL,
    conditions jsonb,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_active boolean DEFAULT true,
    applies_to text,
    applies_to_ids text[],
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    question text NOT NULL,
    answer text NOT NULL,
    category text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    request_type text NOT NULL,
    status text DEFAULT 'pending',
    data_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.influencer_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    handle text NOT NULL,
    display_name text NOT NULL,
    bio text,
    instagram_url text,
    tiktok_url text,
    youtube_url text,
    follower_count integer,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    species text NOT NULL,
    breed text,
    birth_date date,
    weight_kg numeric,
    neck_cm numeric,
    chest_cm numeric,
    length_cm numeric,
    height_cm numeric,
    photo_url text,
    notes text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_bundles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    product_ids text[] NOT NULL,
    original_price numeric NOT NULL,
    bundle_price numeric NOT NULL,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    product_ids text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    identifier text NOT NULL,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    label text NOT NULL,
    full_name text NOT NULL,
    phone text,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text,
    postal_code text NOT NULL,
    country text DEFAULT 'India',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weather_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    weather_condition text NOT NULL,
    temperature_min numeric,
    temperature_max numeric,
    message text NOT NULL,
    suggested_category_id uuid,
    suggested_collection_id uuid,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.back_in_stock_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    size text,
    email text NOT NULL,
    is_notified boolean DEFAULT false,
    notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.breed_sizing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    species text DEFAULT 'dog',
    breed text NOT NULL,
    size_category text NOT NULL,
    recommended_size text NOT NULL,
    min_weight_kg numeric,
    max_weight_kg numeric,
    min_chest_cm numeric,
    max_chest_cm numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
    metric_date date NOT NULL,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    cost numeric DEFAULT 0,
    revenue numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    quantity integer DEFAULT 1,
    size text,
    pet_size text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_applied numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_sla (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    promised_delivery_date timestamp with time zone NOT NULL,
    actual_delivery_date timestamp with time zone,
    sla_met boolean,
    delay_hours numeric,
    delay_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fit_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
    pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
    size_purchased text,
    fit_rating text NOT NULL,
    would_recommend_size text,
    comments text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flash_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    discount_percentage numeric NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    product_ids text[],
    category_ids text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    points integer DEFAULT 0,
    lifetime_points integer DEFAULT 0,
    tier text DEFAULT 'bronze',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    type text NOT NULL,
    points integer NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_gallery (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
    influencer_id uuid REFERENCES public.influencer_profiles(id) ON DELETE SET NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    image_url text NOT NULL,
    caption text,
    likes_count integer DEFAULT 0,
    is_approved boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    gallery_post_id uuid REFERENCES public.pet_gallery(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    gallery_post_id uuid REFERENCES public.pet_gallery(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.image_moderation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    gallery_post_id uuid REFERENCES public.pet_gallery(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    moderation_result jsonb,
    is_approved boolean,
    rejection_reason text,
    moderated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_of_the_week (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    gallery_post_id uuid REFERENCES public.pet_gallery(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    week_end date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_occasions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    occasion_id uuid REFERENCES public.occasion_tags(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    reward_points integer DEFAULT 100,
    uses_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code_id uuid REFERENCES public.referral_codes(id) ON DELETE SET NULL,
    points_awarded boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
    reason text NOT NULL,
    description text,
    status text DEFAULT 'pending',
    refund_amount numeric,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title text,
    content text,
    photos text[],
    is_verified_purchase boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'medium',
    status text DEFAULT 'open',
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    assigned_to text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.satisfaction_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    rating_type text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback text,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shipment_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    location text,
    description text,
    event_time timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    status text DEFAULT 'active',
    frequency text NOT NULL,
    quantity integer DEFAULT 1,
    size text,
    pet_size text,
    next_delivery_date date,
    last_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    message text NOT NULL,
    is_staff boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    payment_status text NOT NULL,
    transaction_id text,
    gateway_response jsonb,
    refund_status text,
    refund_amount numeric,
    refund_processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for all feature tables
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
        'abandoned_carts', 'analytics_events', 'audit_logs', 'back_in_stock_alerts', 
        'breed_sizing_rules', 'campaign_metrics', 'campaigns', 'cart_items', 
        'coupon_uses', 'coupons', 'delivery_sla', 'delivery_slots', 'dynamic_pricing_rules', 
        'faqs', 'fit_feedback', 'flash_sales', 'gallery_comments', 'gallery_likes', 
        'gdpr_requests', 'image_moderation_logs', 'influencer_profiles', 'loyalty_points', 
        'loyalty_transactions', 'payments', 'pet_gallery', 'pet_of_the_week', 'pets', 
        'product_bundles', 'product_comparisons', 'product_occasions', 'push_subscriptions', 
        'rate_limits', 'recently_viewed', 'referral_codes', 'referrals', 'return_requests', 
        'reviews', 'satisfaction_ratings', 'saved_addresses', 'shipment_events', 
        'subscriptions', 'support_tickets', 'ticket_messages', 'weather_suggestions', 
        'wishlist_items'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Basic Admin access to all feature tables
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
        'abandoned_carts', 'analytics_events', 'audit_logs', 'back_in_stock_alerts', 
        'breed_sizing_rules', 'campaign_metrics', 'campaigns', 'cart_items', 
        'coupon_uses', 'coupons', 'delivery_sla', 'delivery_slots', 'dynamic_pricing_rules', 
        'faqs', 'fit_feedback', 'flash_sales', 'gallery_comments', 'gallery_likes', 
        'gdpr_requests', 'image_moderation_logs', 'influencer_profiles', 'loyalty_points', 
        'loyalty_transactions', 'payments', 'pet_gallery', 'pet_of_the_week', 'pets', 
        'product_bundles', 'product_comparisons', 'product_occasions', 'push_subscriptions', 
        'rate_limits', 'recently_viewed', 'referral_codes', 'referrals', 'return_requests', 
        'reviews', 'satisfaction_ratings', 'saved_addresses', 'shipment_events', 
        'subscriptions', 'support_tickets', 'ticket_messages', 'weather_suggestions', 
        'wishlist_items'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'Admin all ' || t) THEN
            EXECUTE format('CREATE POLICY "Admin all %s" ON public.%I FOR ALL USING (public.has_role(auth.uid(), ''admin''::public.app_role))', t, t);
        END IF;
    END LOOP;
END $$;


-- 9. CMS Dynamic Content Schemas
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_text TEXT NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT,
  cta_text TEXT,
  cta_link TEXT,
  discount_percentage INTEGER,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  background_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#FFFFFF',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active promo_banners"
  ON public.promo_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins full access to promo_banners"
  ON public.promo_banners FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icon_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active features"
  ON public.features FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins full access to features"
  ON public.features FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.testimonials_cms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  location TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  review_text TEXT NOT NULL,
  pet_name TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.testimonials_cms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active testimonials"
  ON public.testimonials_cms FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins full access to testimonials"
  ON public.testimonials_cms FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.newsletter_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_text TEXT NOT NULL DEFAULT 'Join the Family',
  headline TEXT NOT NULL DEFAULT 'Unlock 10% Off Your First Order',
  description TEXT NOT NULL DEFAULT 'Plus get early access to new collections, exclusive offers, and adorable pet content.',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.newsletter_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for newsletter_config"
  ON public.newsletter_config FOR SELECT USING (true);
CREATE POLICY "Allow admins full access to newsletter_config"
  ON public.newsletter_config FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  caption TEXT,
  post_url TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active instagram_posts"
  ON public.instagram_posts FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins full access to instagram_posts"
  ON public.instagram_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Insert Default CMS Layout Setup Data
INSERT INTO public.promo_banners (badge_text, headline, subheadline, cta_text, cta_link, discount_percentage, end_date, display_order, is_active)
VALUES 
  ('Limited Time Offer', 'Flat 20% Off', 'On All Twinning Sets', 'Shop Now', '/shop?collection=twinning', 20, NOW() + INTERVAL '7 days', 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.features (icon_name, title, description, display_order, is_active)
VALUES 
  ('Sparkles', 'Premium Fabrics', 'Carefully selected materials for maximum comfort and durability for both you and your pet.', 1, true),
  ('Heart', 'Pet-First Design', 'Every piece is designed with your pet''s comfort and freedom of movement in mind.', 2, true),
  ('RefreshCw', 'Perfect Twinning Fit', 'Our sizing system ensures you and your pet match perfectly, every single time.', 3, true),
  ('Truck', 'Easy Returns', '30-day hassle-free returns. If it doesn''t fit, we''ll make it right.', 4, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.testimonials_cms (customer_name, location, rating, review_text, pet_name, image_url, display_order, is_active)
VALUES 
  ('Sarah Mitchell', 'New York, NY', 5, 'Finally found a brand that understands the bond between me and my golden retriever. The quality is exceptional, and we get so many compliments when we go out!', 'Max', '/testimonial-1.jpg', 1, true),
  ('James Chen', 'San Francisco, CA', 5, 'The attention to detail is incredible. My French bulldog loves wearing his matching outfits, and the fabric is so soft. Worth every penny.', 'Bruno', '/testimonial-2.jpg', 2, true),
  ('Emma Rodriguez', 'Austin, TX', 5, 'I was skeptical at first, but these are genuinely the most comfortable pet clothes we''ve tried. Luna actually gets excited when she sees her matching hoodie!', 'Luna', '/testimonial-3.jpg', 3, true),
  ('Michael Park', 'Seattle, WA', 5, 'The winter collection saved our daily walks. Both my pup and I stay warm and stylish. The customer service team was also incredibly helpful with sizing.', 'Coco', '/testimonial-4.jpg', 4, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.newsletter_config (badge_text, headline, description)
VALUES ('Join the Family', 'Unlock 10% Off Your First Order', 'Plus get early access to new collections, exclusive offers, and adorable pet content.')
ON CONFLICT DO NOTHING;

INSERT INTO public.instagram_posts (image_url, caption, post_url, likes_count, display_order, is_active)
VALUES 
  ('/gallery-1.jpg', 'Sunday vibes with the squad 🐾 #PebricStyle', 'https://instagram.com', 245, 1, true),
  ('/gallery-2.jpg', 'Twinning is winning! Shop the new collection now.', 'https://instagram.com', 189, 2, true),
  ('/gallery-3.jpg', 'Behind the scenes of our latest photoshoot.', 'https://instagram.com', 312, 3, true),
  ('/gallery-4.jpg', 'Customer spotlight: Look at how cute Max looks!', 'https://instagram.com', 567, 4, true)
ON CONFLICT DO NOTHING;


-- 10. File Storage Bucket Settings
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('product-images', 'product-images', true),
  ('avatars', 'avatars', true),
  ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: product-images
CREATE POLICY "rp_select_public_product_images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "rp_insert_auth_product_images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "rp_update_auth_product_images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "rp_delete_auth_product_images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Storage Policies: avatars
CREATE POLICY "rp_select_public_avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "rp_insert_auth_avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "rp_update_auth_avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "rp_delete_auth_avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies: review-photos
CREATE POLICY "rp_select_public_review_photos" ON storage.objects FOR SELECT USING (bucket_id = 'review-photos');
CREATE POLICY "rp_insert_auth_review_photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-photos' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "rp_update_auth_review_photos" ON storage.objects FOR UPDATE USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "rp_delete_auth_review_photos" ON storage.objects FOR DELETE USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);


-- 11. Initial Admin User Setup (In auth.users)
-- Email: admin@pebric.com
-- Password: AdminPassword123!
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

SELECT 'PEBRIC DATABASE INITIALIZED SUCCESSFULLY WITHOUT MOCK PRODUCTS!' as status;
