-- ============================================================================
-- PEBRIC SEED DATA SCRIPT
-- ============================================================================
-- Populates the empty database with initial Categories, Collections, and Products
-- This will make the Admin Dashboard and Shop Page work!
-- ============================================================================

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Pets', 'pets', 'Clothing and accessories for your furry friends'),
  (gen_random_uuid(), 'Owners', 'owners', 'Matching outfits for humans'),
  (gen_random_uuid(), 'Sets', 'sets', 'Complete matching sets for you and your pet')
ON CONFLICT DO NOTHING;

-- 2. Insert Collections
INSERT INTO public.collections (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Summer Vibes', 'summer-vibes', 'Cool and breezy styles for the hot weather'),
  (gen_random_uuid(), 'Cozy Winter', 'cozy-winter', 'Warm knits and comfortable layers'),
  (gen_random_uuid(), 'Rainy Days', 'rainy-days', 'Waterproof gear for splashing around')
ON CONFLICT DO NOTHING;

-- 3. Insert Occasion Tags
INSERT INTO public.occasion_tags (id, name, description) VALUES
  (gen_random_uuid(), 'Casual Walk', 'Perfect for daily strolls'),
  (gen_random_uuid(), 'Party', 'Dress to impress'),
  (gen_random_uuid(), 'Photoshoot', 'Look your best for the camera')
ON CONFLICT DO NOTHING;

-- 4. Insert Sample Products
-- We use subqueries to get valid category/collection IDs dynamically
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  price,
  original_price,
  category_id,
  collection_id,
  sizes,
  pet_sizes,
  images,
  is_active,
  stock,
  is_new_arrival,
  is_featured
) VALUES
-- Product 1: Striped T-Shirt (Pet)
(
  gen_random_uuid(),
  'Striped Sailor Tee (Pet)',
  'striped-sailor-tee-pet',
  'Classic nautical stripes for your first mate.',
  799.00,
  999.00,
  (SELECT id FROM public.categories WHERE slug = 'pets' LIMIT 1),
  (SELECT id FROM public.collections WHERE slug = 'summer-vibes' LIMIT 1),
  ARRAY[]::text[], -- No human sizes
  ARRAY['XS', 'S', 'M', 'L', 'XL'],
  ARRAY['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=400'],
  true,
  50,
  true,
  true
),
-- Product 2: Striped T-Shirt (Owner)
(
  gen_random_uuid(),
  'Striped Sailor Tee (Owner)',
  'striped-sailor-tee-owner',
  'Match your pup in this comfortable cotton tee.',
  1299.00,
  1599.00,
  (SELECT id FROM public.categories WHERE slug = 'owners' LIMIT 1),
  (SELECT id FROM public.collections WHERE slug = 'summer-vibes' LIMIT 1),
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY[]::text[],
  ARRAY['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=400'],
  true,
  30,
  true,
  true
),
-- Product 3: Raincoat Set
(
  gen_random_uuid(),
  'Yellow Raincoat Bundle',
  'yellow-raincoat-bundle',
  'Stay dry together with this bright matching set.',
  2499.00,
  2999.00,
  (SELECT id FROM public.categories WHERE slug = 'sets' LIMIT 1),
  (SELECT id FROM public.collections WHERE slug = 'rainy-days' LIMIT 1),
  ARRAY['Free Size'],
  ARRAY['All Sizes'],
  ARRAY['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400'],
  true,
  15,
  false,
  true
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  (SELECT count(*) FROM public.categories) as categories_count,
  (SELECT count(*) FROM public.collections) as collections_count,
  (SELECT count(*) FROM public.products) as products_count;
