-- ============================================================================
-- CMS Phase 1: Promo Banners & Features Tables
-- ============================================================================

-- 1. PROMO BANNERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS promo_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_text TEXT NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT,
  cta_text TEXT,
  cta_link TEXT,
  discount_percentage INTEGER,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  background_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#FFFFFF',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active banners
CREATE POLICY "Allow public read access for active promo_banners"
  ON promo_banners
  FOR SELECT
  USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to promo_banners"
  ON promo_banners
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_banners_display_order ON promo_banners(display_order);
CREATE INDEX IF NOT EXISTS idx_promo_banners_is_active ON promo_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_banners_end_date ON promo_banners(end_date);

-- Insert default data
INSERT INTO promo_banners (badge_text, headline, subheadline, cta_text, cta_link, discount_percentage, end_date, display_order, is_active)
VALUES 
  ('Limited Time Offer', 'Flat 20% Off', 'On All Twinning Sets', 'Shop Now', '/shop?collection=twinning', 20, NOW() + INTERVAL '7 days', 1, true)
ON CONFLICT DO NOTHING;


-- 2. FEATURES TABLE (Why Choose Us)
-- ================================
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icon_name TEXT NOT NULL, -- Lucide icon name
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active features
CREATE POLICY "Allow public read access for active features"
  ON features
  FOR SELECT
  USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to features"
  ON features
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_features_display_order ON features(display_order);
CREATE INDEX IF NOT EXISTS idx_features_is_active ON features(is_active);

-- Insert default data (from current hardcoded features)
INSERT INTO features (icon_name, title, description, display_order, is_active)
VALUES 
  ('Sparkles', 'Premium Fabrics', 'Carefully selected materials for maximum comfort and durability for both you and your pet.', 1, true),
  ('Heart', 'Pet-First Design', 'Every piece is designed with your pet''s comfort and freedom of movement in mind.', 2, true),
  ('RefreshCw', 'Perfect Twinning Fit', 'Our sizing system ensures you and your pet match perfectly, every single time.', 3, true),
  ('Truck', 'Easy Returns', '30-day hassle-free returns. If it doesn''t fit, we''ll make it right.', 4, true)
ON CONFLICT DO NOTHING;

SELECT 'Phase 1 CMS tables created successfully' as status;
