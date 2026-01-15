-- ============================================================================
-- FIX FOREIGN KEY CONSTRAINTS FOR DELETION
-- ============================================================================
-- Adds ON DELETE CASCADE to "safe" tables so products can be deleted
-- easier without being blocked by cart items, wishlist items, etc.
-- ============================================================================

-- 1. Cart Items (Safe to delete if product is deleted)
ALTER TABLE IF EXISTS public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE IF EXISTS public.cart_items
ADD CONSTRAINT cart_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. Wishlist Items (Safe to delete)
ALTER TABLE IF EXISTS public.wishlist_items
DROP CONSTRAINT IF EXISTS wishlist_items_product_id_fkey;

ALTER TABLE IF EXISTS public.wishlist_items
ADD CONSTRAINT wishlist_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 3. Product Occasions (Safe to delete)
ALTER TABLE IF EXISTS public.product_occasions
DROP CONSTRAINT IF EXISTS product_occasions_product_id_fkey;

ALTER TABLE IF EXISTS public.product_occasions
ADD CONSTRAINT product_occasions_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 4. Recently Viewed (Safe to delete)
ALTER TABLE IF EXISTS public.recently_viewed
DROP CONSTRAINT IF EXISTS recently_viewed_product_id_fkey;

ALTER TABLE IF EXISTS public.recently_viewed
ADD CONSTRAINT recently_viewed_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 5. Back in Stock Alerts (Safe to delete)
ALTER TABLE IF EXISTS public.back_in_stock_alerts
DROP CONSTRAINT IF EXISTS back_in_stock_alerts_product_id_fkey;

ALTER TABLE IF EXISTS public.back_in_stock_alerts
ADD CONSTRAINT back_in_stock_alerts_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- NOTE: We intentionally DO NOT update 'order_items' to CASCADE.
-- Deleting a product should not delete historical order records.
-- If a product has orders, the delete will still fail (correctly),
-- and the UI will now ask the user to deactivate it instead.

SELECT 'Constraints updated slightly to allow easier deletion' as status;
