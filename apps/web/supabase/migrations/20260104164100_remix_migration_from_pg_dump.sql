CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);


--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: abandoned_carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abandoned_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_id text,
    email text,
    cart_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    cart_total numeric DEFAULT 0 NOT NULL,
    abandoned_at timestamp with time zone DEFAULT now() NOT NULL,
    recovered_at timestamp with time zone,
    recovery_email_sent boolean DEFAULT false,
    order_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_id text,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    page_url text,
    referrer text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: back_in_stock_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.back_in_stock_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    email text NOT NULL,
    size text,
    is_notified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    notified_at timestamp with time zone
);


--
-- Name: breed_sizing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.breed_sizing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    species text DEFAULT 'dog'::text NOT NULL,
    breed text NOT NULL,
    size_category text NOT NULL,
    min_weight_kg numeric,
    max_weight_kg numeric,
    min_chest_cm numeric,
    max_chest_cm numeric,
    recommended_size text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1,
    size text,
    pet_size text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: coupon_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    discount_applied numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2) DEFAULT 0,
    max_uses integer,
    uses_count integer DEFAULT 0,
    max_uses_per_user integer DEFAULT 1,
    starts_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    applies_to text DEFAULT 'all'::text,
    applies_to_ids uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT coupons_applies_to_check CHECK ((applies_to = ANY (ARRAY['all'::text, 'category'::text, 'collection'::text, 'product'::text]))),
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))
);


--
-- Name: delivery_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    time_slot text NOT NULL,
    max_orders integer DEFAULT 50 NOT NULL,
    current_orders integer DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dynamic_pricing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dynamic_pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    rule_type text NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    discount_type text NOT NULL,
    discount_value numeric NOT NULL,
    applies_to text DEFAULT 'all'::text,
    applies_to_ids uuid[] DEFAULT '{}'::uuid[],
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fit_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fit_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_item_id uuid,
    product_id uuid NOT NULL,
    pet_id uuid,
    fit_rating text NOT NULL,
    size_purchased text,
    would_recommend_size text,
    comments text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fit_feedback_fit_rating_check CHECK ((fit_rating = ANY (ARRAY['too_tight'::text, 'slightly_tight'::text, 'perfect'::text, 'slightly_loose'::text, 'too_loose'::text])))
);


--
-- Name: flash_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flash_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    discount_percentage numeric NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    product_ids uuid[] DEFAULT '{}'::uuid[],
    category_ids uuid[] DEFAULT '{}'::uuid[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gallery_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gallery_post_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gallery_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gallery_post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gdpr_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gdpr_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    data_url text,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    lifetime_points integer DEFAULT 0 NOT NULL,
    tier text DEFAULT 'bronze'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loyalty_points_tier_check CHECK ((tier = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text])))
);


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer NOT NULL,
    type text NOT NULL,
    description text,
    order_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loyalty_transactions_type_check CHECK ((type = ANY (ARRAY['earned'::text, 'redeemed'::text, 'expired'::text, 'bonus'::text, 'referral'::text])))
);


--
-- Name: occasion_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occasion_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    product_name text NOT NULL,
    product_image text,
    quantity integer NOT NULL,
    size text,
    pet_size text,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
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


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    gateway_response jsonb,
    refund_amount numeric DEFAULT 0,
    refund_status text,
    refund_processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pet_gallery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_gallery (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pet_id uuid,
    product_id uuid,
    image_url text NOT NULL,
    caption text,
    likes_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pet_of_the_week; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pet_of_the_week (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gallery_post_id uuid NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    species text DEFAULT 'dog'::text NOT NULL,
    breed text,
    birth_date date,
    weight_kg numeric(5,2),
    height_cm numeric(5,2),
    neck_cm numeric(5,2),
    chest_cm numeric(5,2),
    length_cm numeric(5,2),
    photo_url text,
    notes text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: product_bundles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_bundles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    product_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    bundle_price numeric NOT NULL,
    original_price numeric NOT NULL,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    product_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_occasions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_occasions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    occasion_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    image_url text,
    images text[] DEFAULT '{}'::text[],
    category_id uuid,
    collection_id uuid,
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
    breathability integer,
    stretch_level integer,
    is_allergy_safe boolean DEFAULT false,
    care_wash text,
    care_dry text,
    durability_rating integer,
    seasonal_tags text[] DEFAULT '{}'::text[],
    matching_human_product_id uuid,
    low_stock_threshold integer DEFAULT 10,
    matching_outfit_description text,
    CONSTRAINT products_breathability_check CHECK (((breathability >= 1) AND (breathability <= 5))),
    CONSTRAINT products_durability_rating_check CHECK (((durability_rating >= 1) AND (durability_rating <= 5))),
    CONSTRAINT products_stretch_level_check CHECK (((stretch_level >= 1) AND (stretch_level <= 5)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
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


--
-- Name: recently_viewed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recently_viewed (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code text NOT NULL,
    uses_count integer DEFAULT 0,
    reward_points integer DEFAULT 100,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    referral_code_id uuid NOT NULL,
    points_awarded boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: return_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    user_id uuid NOT NULL,
    reason text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    refund_amount numeric,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    rating integer NOT NULL,
    title text,
    content text,
    photos text[] DEFAULT '{}'::text[],
    is_verified_purchase boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: satisfaction_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.satisfaction_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    order_id uuid,
    ticket_id uuid,
    rating integer NOT NULL,
    feedback text,
    rating_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT satisfaction_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: saved_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text DEFAULT 'Home'::text NOT NULL,
    full_name text NOT NULL,
    phone text,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text,
    postal_code text NOT NULL,
    country text DEFAULT 'India'::text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    status text NOT NULL,
    location text,
    description text,
    event_time timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    frequency text DEFAULT 'monthly'::text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    pet_size text,
    status text DEFAULT 'active'::text NOT NULL,
    next_delivery_date date NOT NULL,
    last_order_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    assigned_to uuid,
    order_id uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid,
    is_staff boolean DEFAULT false,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: weather_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weather_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    weather_condition text NOT NULL,
    temperature_min integer,
    temperature_max integer,
    suggested_collection_id uuid,
    suggested_category_id uuid,
    message text NOT NULL,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: abandoned_carts abandoned_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abandoned_carts
    ADD CONSTRAINT abandoned_carts_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: back_in_stock_alerts back_in_stock_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.back_in_stock_alerts
    ADD CONSTRAINT back_in_stock_alerts_pkey PRIMARY KEY (id);


--
-- Name: back_in_stock_alerts back_in_stock_alerts_user_id_product_id_size_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.back_in_stock_alerts
    ADD CONSTRAINT back_in_stock_alerts_user_id_product_id_size_key UNIQUE (user_id, product_id, size);


--
-- Name: breed_sizing_rules breed_sizing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.breed_sizing_rules
    ADD CONSTRAINT breed_sizing_rules_pkey PRIMARY KEY (id);


--
-- Name: breed_sizing_rules breed_sizing_rules_species_breed_size_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.breed_sizing_rules
    ADD CONSTRAINT breed_sizing_rules_species_breed_size_category_key UNIQUE (species, breed, size_category);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_user_id_product_id_size_pet_size_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_product_id_size_pet_size_key UNIQUE (user_id, product_id, size, pet_size);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: collections collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_slug_key UNIQUE (slug);


--
-- Name: coupon_uses coupon_uses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: delivery_slots delivery_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_slots
    ADD CONSTRAINT delivery_slots_pkey PRIMARY KEY (id);


--
-- Name: dynamic_pricing_rules dynamic_pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_pricing_rules
    ADD CONSTRAINT dynamic_pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: fit_feedback fit_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fit_feedback
    ADD CONSTRAINT fit_feedback_pkey PRIMARY KEY (id);


--
-- Name: flash_sales flash_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sales
    ADD CONSTRAINT flash_sales_pkey PRIMARY KEY (id);


--
-- Name: gallery_comments gallery_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_comments
    ADD CONSTRAINT gallery_comments_pkey PRIMARY KEY (id);


--
-- Name: gallery_likes gallery_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_likes
    ADD CONSTRAINT gallery_likes_pkey PRIMARY KEY (id);


--
-- Name: gallery_likes gallery_likes_user_id_gallery_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_likes
    ADD CONSTRAINT gallery_likes_user_id_gallery_post_id_key UNIQUE (user_id, gallery_post_id);


--
-- Name: gdpr_requests gdpr_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gdpr_requests
    ADD CONSTRAINT gdpr_requests_pkey PRIMARY KEY (id);


--
-- Name: loyalty_points loyalty_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_pkey PRIMARY KEY (id);


--
-- Name: loyalty_points loyalty_points_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_user_id_key UNIQUE (user_id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: occasion_tags occasion_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occasion_tags
    ADD CONSTRAINT occasion_tags_name_key UNIQUE (name);


--
-- Name: occasion_tags occasion_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occasion_tags
    ADD CONSTRAINT occasion_tags_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pet_gallery pet_gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_gallery
    ADD CONSTRAINT pet_gallery_pkey PRIMARY KEY (id);


--
-- Name: pet_of_the_week pet_of_the_week_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_of_the_week
    ADD CONSTRAINT pet_of_the_week_pkey PRIMARY KEY (id);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- Name: product_bundles product_bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT product_bundles_pkey PRIMARY KEY (id);


--
-- Name: product_comparisons product_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_comparisons
    ADD CONSTRAINT product_comparisons_pkey PRIMARY KEY (id);


--
-- Name: product_occasions product_occasions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_occasions
    ADD CONSTRAINT product_occasions_pkey PRIMARY KEY (id);


--
-- Name: product_occasions product_occasions_product_id_occasion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_occasions
    ADD CONSTRAINT product_occasions_product_id_occasion_id_key UNIQUE (product_id, occasion_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: recently_viewed recently_viewed_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_pkey PRIMARY KEY (id);


--
-- Name: recently_viewed recently_viewed_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: referral_codes referral_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_code_key UNIQUE (code);


--
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- Name: referral_codes referral_codes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_user_id_key UNIQUE (user_id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referred_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_key UNIQUE (referred_id);


--
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: satisfaction_ratings satisfaction_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.satisfaction_ratings
    ADD CONSTRAINT satisfaction_ratings_pkey PRIMARY KEY (id);


--
-- Name: saved_addresses saved_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_addresses
    ADD CONSTRAINT saved_addresses_pkey PRIMARY KEY (id);


--
-- Name: shipment_events shipment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT shipment_events_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: weather_suggestions weather_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_suggestions
    ADD CONSTRAINT weather_suggestions_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: idx_analytics_events_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_created ON public.analytics_events USING btree (created_at);


--
-- Name: idx_analytics_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_type ON public.analytics_events USING btree (event_type);


--
-- Name: idx_analytics_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_user ON public.analytics_events USING btree (user_id);


--
-- Name: orders generate_order_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();


--
-- Name: coupons update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loyalty_points update_loyalty_points_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pets update_pets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: return_requests update_return_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_return_requests_updated_at BEFORE UPDATE ON public.return_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: back_in_stock_alerts back_in_stock_alerts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.back_in_stock_alerts
    ADD CONSTRAINT back_in_stock_alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coupon_uses coupon_uses_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_uses coupon_uses_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: fit_feedback fit_feedback_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fit_feedback
    ADD CONSTRAINT fit_feedback_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: fit_feedback fit_feedback_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fit_feedback
    ADD CONSTRAINT fit_feedback_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id);


--
-- Name: fit_feedback fit_feedback_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fit_feedback
    ADD CONSTRAINT fit_feedback_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: gallery_comments gallery_comments_gallery_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_comments
    ADD CONSTRAINT gallery_comments_gallery_post_id_fkey FOREIGN KEY (gallery_post_id) REFERENCES public.pet_gallery(id) ON DELETE CASCADE;


--
-- Name: gallery_likes gallery_likes_gallery_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_likes
    ADD CONSTRAINT gallery_likes_gallery_post_id_fkey FOREIGN KEY (gallery_post_id) REFERENCES public.pet_gallery(id) ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders orders_delivery_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_slot_id_fkey FOREIGN KEY (delivery_slot_id) REFERENCES public.delivery_slots(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: pet_gallery pet_gallery_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_gallery
    ADD CONSTRAINT pet_gallery_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL;


--
-- Name: pet_gallery pet_gallery_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_gallery
    ADD CONSTRAINT pet_gallery_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: pet_of_the_week pet_of_the_week_gallery_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pet_of_the_week
    ADD CONSTRAINT pet_of_the_week_gallery_post_id_fkey FOREIGN KEY (gallery_post_id) REFERENCES public.pet_gallery(id);


--
-- Name: product_comparisons product_comparisons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_comparisons
    ADD CONSTRAINT product_comparisons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: product_occasions product_occasions_occasion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_occasions
    ADD CONSTRAINT product_occasions_occasion_id_fkey FOREIGN KEY (occasion_id) REFERENCES public.occasion_tags(id) ON DELETE CASCADE;


--
-- Name: product_occasions product_occasions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_occasions
    ADD CONSTRAINT product_occasions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: products products_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id);


--
-- Name: products products_matching_human_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_matching_human_product_id_fkey FOREIGN KEY (matching_human_product_id) REFERENCES public.products(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recently_viewed recently_viewed_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referral_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_id_fkey FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id);


--
-- Name: return_requests return_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: return_requests return_requests_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: shipment_events shipment_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT shipment_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_last_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_last_order_id_fkey FOREIGN KEY (last_order_id) REFERENCES public.orders(id);


--
-- Name: subscriptions subscriptions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: support_tickets support_tickets_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: ticket_messages ticket_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: weather_suggestions weather_suggestions_suggested_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_suggestions
    ADD CONSTRAINT weather_suggestions_suggested_category_id_fkey FOREIGN KEY (suggested_category_id) REFERENCES public.categories(id);


--
-- Name: weather_suggestions weather_suggestions_suggested_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_suggestions
    ADD CONSTRAINT weather_suggestions_suggested_collection_id_fkey FOREIGN KEY (suggested_collection_id) REFERENCES public.collections(id);


--
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: faqs Admins can manage FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage FAQs" ON public.faqs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gdpr_requests Admins can manage GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage GDPR requests" ON public.gdpr_requests USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: abandoned_carts Admins can manage abandoned carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gallery_comments Admins can manage all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all comments" ON public.gallery_comments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupon_uses Admins can manage all coupon uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all coupon uses" ON public.coupon_uses USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pet_gallery Admins can manage all gallery posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all gallery posts" ON public.pet_gallery USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: order_items Admins can manage all order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all order items" ON public.order_items USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can manage all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all orders" ON public.orders USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_points Admins can manage all points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all points" ON public.loyalty_points USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_codes Admins can manage all referral codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can manage all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all referrals" ON public.referrals USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: return_requests Admins can manage all return requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all return requests" ON public.return_requests USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reviews Admins can manage all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all reviews" ON public.reviews USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: shipment_events Admins can manage all shipment events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all shipment events" ON public.shipment_events USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticket_messages Admins can manage all ticket messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Admins can manage all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_transactions Admins can manage all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all transactions" ON public.loyalty_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_bundles Admins can manage bundles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage bundles" ON public.product_bundles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: collections Admins can manage collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage collections" ON public.collections USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupons Admins can manage coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage coupons" ON public.coupons USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: delivery_slots Admins can manage delivery slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage delivery slots" ON public.delivery_slots USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: flash_sales Admins can manage flash sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage flash sales" ON public.flash_sales USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: occasion_tags Admins can manage occasion tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage occasion tags" ON public.occasion_tags USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pet_of_the_week Admins can manage pet of the week; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pet of the week" ON public.pet_of_the_week USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: dynamic_pricing_rules Admins can manage pricing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pricing rules" ON public.dynamic_pricing_rules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_occasions Admins can manage product occasions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage product occasions" ON public.product_occasions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage products" ON public.products USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: breed_sizing_rules Admins can manage sizing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sizing rules" ON public.breed_sizing_rules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: weather_suggestions Admins can manage weather suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage weather suggestions" ON public.weather_suggestions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payments Admins can update payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: analytics_events Admins can view all events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all events" ON public.analytics_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fit_feedback Admins can view all feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all feedback" ON public.fit_feedback USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: order_items Admins can view all order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payments Admins can view all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can view all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: satisfaction_ratings Admins can view all ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all ratings" ON public.satisfaction_ratings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_tickets Anyone can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);


--
-- Name: faqs Anyone can view active FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active FAQs" ON public.faqs FOR SELECT USING ((is_active = true));


--
-- Name: product_bundles Anyone can view active bundles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active bundles" ON public.product_bundles FOR SELECT USING ((is_active = true));


--
-- Name: coupons Anyone can view active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING ((is_active = true));


--
-- Name: flash_sales Anyone can view active flash sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active flash sales" ON public.flash_sales FOR SELECT USING (((is_active = true) AND (starts_at <= now()) AND (ends_at >= now())));


--
-- Name: products Anyone can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING ((is_active = true));


--
-- Name: pet_gallery Anyone can view approved gallery posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved gallery posts" ON public.pet_gallery FOR SELECT USING ((is_approved = true));


--
-- Name: delivery_slots Anyone can view available delivery slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view available delivery slots" ON public.delivery_slots FOR SELECT USING ((is_available = true));


--
-- Name: categories Anyone can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);


--
-- Name: collections Anyone can view collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view collections" ON public.collections FOR SELECT USING (true);


--
-- Name: gallery_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.gallery_comments FOR SELECT USING (true);


--
-- Name: gallery_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.gallery_likes FOR SELECT USING (true);


--
-- Name: occasion_tags Anyone can view occasion tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view occasion tags" ON public.occasion_tags FOR SELECT USING ((is_active = true));


--
-- Name: pet_of_the_week Anyone can view pet of the week; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view pet of the week" ON public.pet_of_the_week FOR SELECT USING (true);


--
-- Name: product_occasions Anyone can view product occasions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view product occasions" ON public.product_occasions FOR SELECT USING (true);


--
-- Name: reviews Anyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);


--
-- Name: breed_sizing_rules Anyone can view sizing rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view sizing rules" ON public.breed_sizing_rules FOR SELECT USING (true);


--
-- Name: weather_suggestions Anyone can view weather suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view weather suggestions" ON public.weather_suggestions FOR SELECT USING ((is_active = true));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: ticket_messages Users can add messages to their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add messages to their tickets" ON public.ticket_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = ticket_messages.ticket_id) AND ((support_tickets.user_id = auth.uid()) OR (support_tickets.email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))))));


--
-- Name: gallery_comments Users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create comments" ON public.gallery_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: coupon_uses Users can create coupon uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create coupon uses" ON public.coupon_uses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: analytics_events Users can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create events" ON public.analytics_events FOR INSERT WITH CHECK (true);


--
-- Name: fit_feedback Users can create feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create feedback" ON public.fit_feedback FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pet_gallery Users can create gallery posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create gallery posts" ON public.pet_gallery FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: order_items Users can create order items for their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create order items for their orders" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: payments Users can create payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: satisfaction_ratings Users can create ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create ratings" ON public.satisfaction_ratings FOR INSERT WITH CHECK (((auth.uid() = user_id) OR (user_id IS NULL)));


--
-- Name: return_requests Users can create return requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create return requests" ON public.return_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: gdpr_requests Users can create their own GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own GDPR requests" ON public.gdpr_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orders Users can create their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pets Users can create their own pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own pets" ON public.pets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: loyalty_points Users can create their own points record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own points record" ON public.loyalty_points FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: referral_codes Users can create their own referral code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own referral code" ON public.referral_codes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: gallery_comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.gallery_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: pets Users can delete their own pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: pet_gallery Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.pet_gallery FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: recently_viewed Users can delete their own recently viewed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own recently viewed" ON public.recently_viewed FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: recently_viewed Users can insert their own recently viewed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own recently viewed" ON public.recently_viewed FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_addresses Users can manage their own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own addresses" ON public.saved_addresses USING ((auth.uid() = user_id));


--
-- Name: back_in_stock_alerts Users can manage their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own alerts" ON public.back_in_stock_alerts USING ((auth.uid() = user_id));


--
-- Name: cart_items Users can manage their own cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own cart" ON public.cart_items USING ((auth.uid() = user_id));


--
-- Name: product_comparisons Users can manage their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own comparisons" ON public.product_comparisons USING ((auth.uid() = user_id));


--
-- Name: gallery_likes Users can manage their own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own likes" ON public.gallery_likes USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can manage their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions USING ((auth.uid() = user_id));


--
-- Name: wishlist_items Users can manage their own wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own wishlist" ON public.wishlist_items USING ((auth.uid() = user_id));


--
-- Name: gallery_comments Users can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comments" ON public.gallery_comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: pets Users can update their own pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: pet_gallery Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.pet_gallery FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: payments Users can view own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users can view referrals they made; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view referrals they made" ON public.referrals FOR SELECT USING ((auth.uid() = referrer_id));


--
-- Name: shipment_events Users can view their order shipment events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their order shipment events" ON public.shipment_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = shipment_events.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: gdpr_requests Users can view their own GDPR requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own GDPR requests" ON public.gdpr_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: abandoned_carts Users can view their own abandoned carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own abandoned carts" ON public.abandoned_carts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cart_items Users can view their own cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: coupon_uses Users can view their own coupon uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own coupon uses" ON public.coupon_uses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: fit_feedback Users can view their own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own feedback" ON public.fit_feedback FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: order_items Users can view their own order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: orders Users can view their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pets Users can view their own pets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pets" ON public.pets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loyalty_points Users can view their own points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own points" ON public.loyalty_points FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pet_gallery Users can view their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own posts" ON public.pet_gallery FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: satisfaction_ratings Users can view their own ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ratings" ON public.satisfaction_ratings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: recently_viewed Users can view their own recently viewed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own recently viewed" ON public.recently_viewed FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referral_codes Users can view their own referral code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own referral code" ON public.referral_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: return_requests Users can view their own return requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own return requests" ON public.return_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (((auth.uid() = user_id) OR (email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: loyalty_transactions Users can view their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wishlist_items Users can view their own wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own wishlist" ON public.wishlist_items FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ticket_messages Users can view their ticket messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their ticket messages" ON public.ticket_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = ticket_messages.ticket_id) AND ((support_tickets.user_id = auth.uid()) OR (support_tickets.email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))))));


--
-- Name: abandoned_carts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: back_in_stock_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.back_in_stock_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: breed_sizing_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.breed_sizing_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: cart_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_uses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: dynamic_pricing_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: faqs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

--
-- Name: fit_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fit_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: flash_sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gallery_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: gdpr_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: occasion_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.occasion_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: pet_gallery; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pet_gallery ENABLE ROW LEVEL SECURITY;

--
-- Name: pet_of_the_week; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pet_of_the_week ENABLE ROW LEVEL SECURITY;

--
-- Name: pets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

--
-- Name: product_bundles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

--
-- Name: product_comparisons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;

--
-- Name: product_occasions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_occasions ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: recently_viewed; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: return_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: satisfaction_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.satisfaction_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: shipment_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: weather_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weather_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;