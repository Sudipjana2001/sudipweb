-- ============================================================
-- PEBRIC MISSING DATABASE OBJECTS FIX
-- Recreates all missing RPC functions
-- ============================================================

-- 1. delete_product_admin: Safely deletes a product by ID
--    Used by Admin.tsx handleDelete()
CREATE OR REPLACE FUNCTION public.delete_product_admin(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Remove from wishlist items
  DELETE FROM public.wishlist_items WHERE public.wishlist_items.product_id = delete_product_admin.product_id;

  -- Remove from cart items  
  DELETE FROM public.cart_items WHERE public.cart_items.product_id = delete_product_admin.product_id;

  -- Remove from recently viewed
  DELETE FROM public.recently_viewed WHERE public.recently_viewed.product_id = delete_product_admin.product_id;

  -- Remove product occasions
  DELETE FROM public.product_occasions WHERE public.product_occasions.product_id = delete_product_admin.product_id;

  -- Remove reviews
  DELETE FROM public.reviews WHERE public.reviews.product_id = delete_product_admin.product_id;

  -- Finally delete the product itself
  DELETE FROM public.products WHERE id = delete_product_admin.product_id;
END;
$$;

-- Grant execute to authenticated users (RLS on the function handles admin check)
GRANT EXECUTE ON FUNCTION public.delete_product_admin(uuid) TO authenticated;

-- 2. get_review_summary: Returns aggregate review stats for a product
--    Used by useReviews.ts
CREATE OR REPLACE FUNCTION public.get_review_summary(p_product_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'average_rating', COALESCE(AVG(rating)::numeric(3,2), 0),
    'total_reviews', COUNT(*),
    'rating_distribution', json_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    )
  )
  INTO result
  FROM public.reviews
  WHERE product_id = p_product_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_summary(uuid) TO anon, authenticated;

-- 3. mark_review_helpful: Increments helpful_count on a review
--    Used by useReviews.ts
CREATE OR REPLACE FUNCTION public.mark_review_helpful(p_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = p_review_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_review_helpful(uuid) TO authenticated;

-- 4. Ensure categories and collections have public read policies
--    (These are needed for storefront filters without authentication)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist to avoid conflicts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read categories' AND tablename = 'categories') THEN
    DROP POLICY "Public read categories" ON public.categories;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage categories' AND tablename = 'categories') THEN
    DROP POLICY "Admin manage categories" ON public.categories;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read collections' AND tablename = 'collections') THEN
    DROP POLICY "Public read collections" ON public.collections;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage collections' AND tablename = 'collections') THEN
    DROP POLICY "Admin manage collections" ON public.collections;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active products' AND tablename = 'products') THEN
    DROP POLICY "Public read active products" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage products' AND tablename = 'products') THEN
    DROP POLICY "Admin manage products" ON public.products;
  END IF;
END $$;

-- Categories: public read, admin full access
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admin manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Collections: public read, admin full access
CREATE POLICY "Public read collections"
  ON public.collections FOR SELECT USING (true);

CREATE POLICY "Admin manage collections"
  ON public.collections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Products: public read active, admin full access
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Upsert default categories if missing
INSERT INTO public.categories (name, slug, description) VALUES
  ('Owners', 'owners', 'Matching clothes for owners'),
  ('Pet',    'pet',    'Outfits and accessories for pets'),
  ('Set',    'set',    'Matching sets for pets and owners')
ON CONFLICT (slug) DO NOTHING;

-- 6. Upsert default collections if missing
INSERT INTO public.collections (name, slug, description, image_url) VALUES
  ('Summer', 'summer', 'Breezy and light clothing for the warm weather', '/collection-summer.jpg'),
  ('Winter', 'winter', 'Cozy and warm layers for chilly days',           '/collection-winter.jpg'),
  ('Rainy',  'rainy',  'Waterproof and weather-resistant styles',         '/collection-rainy.jpg')
ON CONFLICT (slug) DO NOTHING;

SELECT 'All missing database objects have been recreated successfully!' AS status;
