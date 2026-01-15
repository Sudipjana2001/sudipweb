-- ============================================================================
-- FIX ORDERS SCHEMA AND POLICIES
-- ============================================================================
-- 1. Adds missing Admin RLS policies for Orders (so you can see them!)
-- 2. Changes product link to ON DELETE SET NULL (so you can delete products!)
-- ============================================================================

-- 1. ADD ADMIN POLICIES FOR ORDERS
-- (Previous script missed these, causing "0 Orders" to show in dashboard)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all orders') THEN
        CREATE POLICY "Admin all orders" ON public.orders 
        FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all order_items') THEN
        CREATE POLICY "Admin all order_items" ON public.order_items 
        FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    END IF;
    
    -- Also add "Users can view their own orders" while we are at it
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users own orders') THEN
        CREATE POLICY "Users own orders" ON public.orders 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users own order items') THEN
        CREATE POLICY "Users own order items" ON public.order_items 
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        );
    END IF;
END $$;

-- 2. FIX FOREIGN KEY TO ALLOW PRODUCT DELETION
-- We change the constraint to "SET NULL".
-- This keeps the order record (and product_name snapshot) but unlinks the deleted product.
ALTER TABLE IF EXISTS public.order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE IF EXISTS public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 3. FIX CART ITEMS JUST IN CASE (Cascade)
-- (Users cart should just lose the item if product is deleted)
ALTER TABLE IF EXISTS public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE IF EXISTS public.cart_items
ADD CONSTRAINT cart_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

SELECT 'Orders schema fixed. You can now see orders and delete products!' as status;
