-- Run this SQL in your Supabase SQL editor to create the hero_slides table
-- This can be run manually or as a migration

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT,
  cta1_text TEXT,
  cta1_link TEXT,
  cta2_text TEXT,
  cta2_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active slides
CREATE POLICY "Allow public read access for active slides"
  ON hero_slides
  FOR SELECT
  USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to hero_slides"
  ON hero_slides
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_hero_slides_display_order ON hero_slides(display_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_is_active ON hero_slides(is_active);

-- Insert default slides (migrating from hardcoded data)
INSERT INTO hero_slides (image_url, headline, subheadline, cta1_text, cta1_link, cta2_text, cta2_link, display_order, is_active)
VALUES 
  ('/hero-1.jpg', 'Where Pets & Style Twin', 'Premium comfort meets perfect design. Matching outfits for you and your best friend.', 'Shop Twinning Sets', '/shop?collection=twinning', 'Explore Collections', '/shop', 1, true),
  ('/hero-2.jpg', 'Summer Collection 2024', 'Breathable fabrics, effortless style. Stay cool together this season.', 'Shop Summer', '/summer', 'View Lookbook', '/shop', 2, true),
  ('/hero-3.jpg', 'Cozy Winter Essentials', 'Warmth never looked this good. Luxurious layers for cold days.', 'Shop Winter', '/winter', 'Explore Styles', '/shop', 3, true)
ON CONFLICT DO NOTHING;
