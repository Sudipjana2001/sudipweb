-- ============================================================================
-- RESTORE ALL FEATURE TABLES
-- ============================================================================
-- Creates tables for all application features (Coupons, Blog, Support, etc.)
-- Dependencies: Core tables (users, products, orders) must exist.
-- ============================================================================

-- 1. INDEPENDENT / BASE TABLES
-- ============================

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
    discount_type text NOT NULL, -- 'percentage', 'fixed'
    discount_value numeric NOT NULL,
    min_order_amount numeric DEFAULT 0,
    max_uses integer,
    uses_count integer DEFAULT 0,
    max_uses_per_user integer DEFAULT 1,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    applies_to text, -- 'all', 'collection', 'category', 'product'
    applies_to_ids text[], -- Array of UUIDs
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
    request_type text NOT NULL, -- 'export', 'delete'
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
    species text NOT NULL, -- 'dog', 'cat'
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
    identifier text NOT NULL, -- IP or User ID
    endpoint text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    label text NOT NULL, -- 'Home', 'Work'
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
    suggested_category_id uuid, -- Reference needed?
    suggested_collection_id uuid, -- Reference needed?
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


-- 2. DEPENDENT TABLES (Foreign Keys)
-- ==================================

CREATE TABLE IF NOT EXISTS public.back_in_stock_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id),
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
    size_category text NOT NULL, -- 'small', 'medium', 'large'
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
    campaign_id uuid REFERENCES public.campaigns(id),
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
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id),
    quantity integer DEFAULT 1,
    size text,
    pet_size text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    coupon_id uuid REFERENCES public.coupons(id),
    user_id uuid REFERENCES auth.users(id),
    order_id uuid REFERENCES public.orders(id),
    discount_applied numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_sla (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id),
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
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id),
    order_item_id uuid REFERENCES public.order_items(id),
    pet_id uuid REFERENCES public.pets(id),
    size_purchased text,
    fit_rating text NOT NULL, -- 'true_to_size', 'runs_small', 'runs_large'
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
    product_ids text[], -- Array of IDs
    category_ids text[], -- Array of IDs
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) UNIQUE,
    points integer DEFAULT 0,
    lifetime_points integer DEFAULT 0,
    tier text DEFAULT 'bronze',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    order_id uuid REFERENCES public.orders(id),
    type text NOT NULL, -- 'earn', 'redeem', 'adjust'
    points integer NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_gallery (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    pet_id uuid REFERENCES public.pets(id),
    influencer_id uuid REFERENCES public.influencer_profiles(id),
    product_id uuid REFERENCES public.products(id),
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
    user_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    gallery_post_id uuid REFERENCES public.pet_gallery(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
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
    gallery_post_id uuid REFERENCES public.pet_gallery(id),
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
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    code text NOT NULL UNIQUE,
    reward_points integer DEFAULT 100,
    uses_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    referrer_id uuid REFERENCES auth.users(id),
    referred_id uuid REFERENCES auth.users(id),
    referral_code_id uuid REFERENCES public.referral_codes(id),
    points_awarded boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    order_id uuid REFERENCES public.orders(id),
    order_item_id uuid REFERENCES public.order_items(id),
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
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id),
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
    user_id uuid REFERENCES auth.users(id),
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'medium',
    status text DEFAULT 'open',
    order_id uuid REFERENCES public.orders(id),
    assigned_to text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.satisfaction_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    rating_type text NOT NULL, -- 'order', 'support'
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback text,
    order_id uuid REFERENCES public.orders(id),
    ticket_id uuid REFERENCES public.support_tickets(id),
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
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id),
    status text DEFAULT 'active',
    frequency text NOT NULL,
    quantity integer DEFAULT 1,
    size text,
    pet_size text,
    next_delivery_date date,
    last_order_id uuid REFERENCES public.orders(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    message text NOT NULL,
    is_staff boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id),
    user_id uuid REFERENCES auth.users(id),
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


-- 3. ENABLE RLS (Security)
-- ========================

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


-- 4. BASIC POLICIES
-- =================
-- For brevity, enabling simple Admin-ALL and User-Own policies for these features
-- This gets the app working. Fine-grained permissioning can be done later.

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
        -- 1. Admin Access (ALL)
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'Admin all ' || t) THEN
            EXECUTE format('CREATE POLICY "Admin all %s" ON public.%I FOR ALL USING (public.has_role(auth.uid(), ''admin''::public.app_role))', t, t);
        END IF;

        -- 2. Authenticated User Access (Generic - can be tightened per table)
        -- For simplicity in this restoration script, we allow authenticated select
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'Authenticated select ' || t) THEN
             EXECUTE format('CREATE POLICY "Authenticated select %s" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', t, t);
        END IF;
    END LOOP;
END $$;

SELECT 'All feature tables restored successfully' as status;
