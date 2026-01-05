-- ============================================================================
-- FIX ALL DELETE CONSTRAINTS AND PERMISSIONS
-- ============================================================================
-- 1. Adds ON DELETE CASCADE to ALL remaining tables referencing products
-- 2. Refreshes the Delete Policy to ensure Admin access is working
-- ============================================================================

-- 1. Reviews
ALTER TABLE IF EXISTS public.reviews
DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;

ALTER TABLE IF EXISTS public.reviews
ADD CONSTRAINT reviews_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. Subscriptions
ALTER TABLE IF EXISTS public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_product_id_fkey;

ALTER TABLE IF EXISTS public.subscriptions
ADD CONSTRAINT subscriptions_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 3. Fit Feedback
ALTER TABLE IF EXISTS public.fit_feedback
DROP CONSTRAINT IF EXISTS fit_feedback_product_id_fkey;

ALTER TABLE IF EXISTS public.fit_feedback
ADD CONSTRAINT fit_feedback_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 4. Pet Gallery
ALTER TABLE IF EXISTS public.pet_gallery
DROP CONSTRAINT IF EXISTS pet_gallery_product_id_fkey;

ALTER TABLE IF EXISTS public.pet_gallery
ADD CONSTRAINT pet_gallery_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL; -- Logic: keep the post, just remove link

-- 5. Back in Stock Alerts (Re-verify)
ALTER TABLE IF EXISTS public.back_in_stock_alerts
DROP CONSTRAINT IF EXISTS back_in_stock_alerts_product_id_fkey;

ALTER TABLE IF EXISTS public.back_in_stock_alerts
ADD CONSTRAINT back_in_stock_alerts_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 6. Recently Viewed (Re-verify)
ALTER TABLE IF EXISTS public.recently_viewed
DROP CONSTRAINT IF EXISTS recently_viewed_product_id_fkey;

ALTER TABLE IF EXISTS public.recently_viewed
ADD CONSTRAINT recently_viewed_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 7. REFRESH ADMIN POLICY 
-- Drop and Recreate to be 100% sure it applies to DELETE
DROP POLICY IF EXISTS "Admin all products" ON public.products;

CREATE POLICY "Admin all products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 8. Enable Delete for Authenticated (TEMPORARY FIX CHECK)
-- Uncomment below if still failing, to rule out "has_role" issues
-- CREATE POLICY "Temp Delete All" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

SELECT 'All constraints and policies refreshed.' as status;
