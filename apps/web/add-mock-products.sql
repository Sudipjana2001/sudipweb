-- ============================================================================
-- ADD MORE MOCK PRODUCTS
-- ============================================================================

-- Summer Collection Extras
INSERT INTO public.products (id, name, slug, description, price, original_price, category_id, collection_id, sizes, pet_sizes, images, is_active, stock, is_new_arrival, is_featured)
VALUES
(gen_random_uuid(), 'Floral Summer Dress (Owner)', 'floral-summer-dress-owner', 'Lightweight floral dress perfect for sunny days.', 1499.00, 1899.00, 
 (SELECT id FROM categories WHERE slug = 'owners' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'summer-vibes' LIMIT 1),
 ARRAY['S', 'M', 'L'], ARRAY[]::text[], 
 ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400'], true, 20, true, true),

(gen_random_uuid(), 'Floral Bandana (Pet)', 'floral-bandana-pet', 'Matching floral bandana for your furry friend.', 299.00, 499.00, 
 (SELECT id FROM categories WHERE slug = 'pets' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'summer-vibes' LIMIT 1),
 ARRAY[]::text[], ARRAY['S', 'M', 'L'], 
 ARRAY['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400'], true, 50, true, false), -- Reusing image for mock

(gen_random_uuid(), 'Beach Day Shirt (Owner)', 'beach-day-shirt-owner', 'Tropical print shirt for beach vibes.', 1199.00, 1499.00, 
 (SELECT id FROM categories WHERE slug = 'owners' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'summer-vibes' LIMIT 1),
 ARRAY['M', 'L', 'XL'], ARRAY[]::text[], 
 ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400'], true, 25, true, false),

(gen_random_uuid(), 'Tropical Bow Tie (Pet)', 'tropical-bow-tie-pet', 'Dapper bow tie with tropical print.', 399.00, 0, 
 (SELECT id FROM categories WHERE slug = 'pets' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'summer-vibes' LIMIT 1),
 ARRAY[]::text[], ARRAY['One Size'], 
 ARRAY['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400'], true, 40, true, false);


-- Winter Collection Extras
INSERT INTO public.products (id, name, slug, description, price, original_price, category_id, collection_id, sizes, pet_sizes, images, is_active, stock, is_new_arrival, is_featured)
VALUES
(gen_random_uuid(), 'Cable Knit Sweater (Owner)', 'cable-knit-sweater-owner', 'Cozy cable knit sweater for chilly evenings.', 2499.00, 3299.00, 
 (SELECT id FROM categories WHERE slug = 'owners' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'cozy-winter' LIMIT 1),
 ARRAY['S', 'M', 'L', 'XL'], ARRAY[]::text[], 
 ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400'], true, 15, false, true),

(gen_random_uuid(), 'Cable Knit Sweater (Pet)', 'cable-knit-sweater-pet', 'Matching knit sweater to keep your pet warm.', 999.00, 1299.00, 
 (SELECT id FROM categories WHERE slug = 'pets' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'cozy-winter' LIMIT 1),
 ARRAY[]::text[], ARRAY['XS', 'S', 'M', 'L', 'XL'], 
 ARRAY['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400'], true, 30, false, true),

(gen_random_uuid(), 'Puffer Vest (Owner)', 'puffer-vest-owner', 'Insulated vest for outdoor adventures.', 1999.00, 2499.00, 
 (SELECT id FROM categories WHERE slug = 'owners' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'cozy-winter' LIMIT 1),
 ARRAY['M', 'L', 'XL'], ARRAY[]::text[], 
 ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=400'], true, 20, false, false),

(gen_random_uuid(), 'Puffer Jacket (Pet)', 'puffer-jacket-pet', 'Warm puffer jacket for snowy walks.', 1299.00, 0, 
 (SELECT id FROM categories WHERE slug = 'pets' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'cozy-winter' LIMIT 1),
 ARRAY[]::text[], ARRAY['S', 'M', 'L'], 
 ARRAY['https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&q=80&w=400'], true, 25, false, true);


-- Rainy Days Extras
INSERT INTO public.products (id, name, slug, description, price, original_price, category_id, collection_id, sizes, pet_sizes, images, is_active, stock, is_new_arrival, is_featured)
VALUES
(gen_random_uuid(), 'Waterproof Parka (Owner)', 'waterproof-parka-owner', 'Heavy-duty waterproof parka for monsoon.', 3499.00, 4599.00, 
 (SELECT id FROM categories WHERE slug = 'owners' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'rainy-days' LIMIT 1),
 ARRAY['S', 'M', 'L'], ARRAY[]::text[], 
 ARRAY['https://plus.unsplash.com/premium_photo-1661645343603-625d97d91133?auto=format&fit=crop&q=80&w=400'], true, 10, false, false),

(gen_random_uuid(), 'Rain Boots (Pet)', 'rain-boots-pet', 'Cute silicone boots to keep paws dry.', 599.00, 799.00, 
 (SELECT id FROM categories WHERE slug = 'pets' LIMIT 1), 
 (SELECT id FROM collections WHERE slug = 'rainy-days' LIMIT 1),
 ARRAY[]::text[], ARRAY['S', 'M', 'L'], 
 ARRAY['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400'], true, 40, true, false);
