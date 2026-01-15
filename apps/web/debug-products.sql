-- CHECK 1: Total products
SELECT count(*) as total_products FROM public.products;

-- CHECK 2: Active products
SELECT count(*) as active_products FROM public.products WHERE is_active = true;

-- CHECK 3: Products with no category/collection (Orphans)
SELECT * FROM public.products WHERE category_id IS NULL OR collection_id IS NULL LIMIT 5;

-- CHECK 4: RLS Policy Verify
SELECT 
    schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'products';

-- CHECK 5: Force Public Read (Fix if missing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read products') THEN
        CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
    END IF;
END $$;
