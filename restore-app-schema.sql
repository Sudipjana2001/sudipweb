-- ============================================================================
-- RESTORE APPLICATION TABLES (FIXED)
-- ============================================================================
-- Corrected: Function defined FIRST, and using explicit type casting
-- ============================================================================

-- 0. Helper function (Must be first!)
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

-- 1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Collections
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Occasion Tags
CREATE TABLE IF NOT EXISTS public.occasion_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    image_url text,
    images text[] DEFAULT '{}'::text[],
    category_id uuid REFERENCES public.categories(id),
    collection_id uuid REFERENCES public.collections(id),
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

-- 5. Orders & Order Items
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
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
    order_id uuid NOT NULL REFERENCES public.orders(id),
    product_id uuid REFERENCES public.products(id),
    product_name text NOT NULL,
    product_image text,
    quantity integer NOT NULL,
    size text,
    pet_size text,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 6. Enable RLS (Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Public Read Access) - Wrapped in DO blocks to avoid errors if exist
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

-- 8. RLS Policies (Admin Write Access)
-- KEY FIX: Using explicit casting 'admin'::public.app_role
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

SELECT 'Tables restored correctly!' as status;
