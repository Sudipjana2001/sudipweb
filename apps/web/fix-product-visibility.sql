-- ============================================================================
-- FIX PRODUCT VISIBILITY ISSUES
-- ============================================================================
-- 1. Forces Public Read Access on Products, Categories, and Collections
-- 2. Ensures all existing products are set to "Active"
-- ============================================================================

-- 1. RESET PUBLIC POLICIES (Drop and Recreate to be sure)
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read collections" ON public.collections;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON public.collections FOR SELECT USING (true);

-- 2. ENSURE RLS IS ENABLED (Just in case)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 3. FORCE ACTIVE STATUS
-- (Sometimes products get created as inactive or null)
UPDATE public.products 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- 4. GRANT PERMISSIONS TO ANON (The public user setup)
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.collections TO anon;

SELECT 'Visibility fixed! All products should now be visible.' as status;
