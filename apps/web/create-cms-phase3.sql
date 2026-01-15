-- ============================================================================
-- CMS Phase 3: Newsletter & Instagram Tables
-- ============================================================================

-- 4. NEWSLETTER CONFIG TABLE
-- =========================
CREATE TABLE IF NOT EXISTS newsletter_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_text TEXT NOT NULL DEFAULT 'Join the Family',
  headline TEXT NOT NULL DEFAULT 'Unlock 10% Off Your First Order',
  description TEXT NOT NULL DEFAULT 'Plus get early access to new collections, exclusive offers, and adorable pet content.',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (always need to show the form configuration if active)
CREATE POLICY "Allow public read access for newsletter_config"
  ON newsletter_config
  FOR SELECT
  USING (true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to newsletter_config"
  ON newsletter_config
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Insert default single record
INSERT INTO newsletter_config (badge_text, headline, description)
VALUES ('Join the Family', 'Unlock 10% Off Your First Order', 'Plus get early access to new collections, exclusive offers, and adorable pet content.')
ON CONFLICT DO NOTHING;


-- 5. INSTAGRAM POSTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS instagram_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  caption TEXT,
  post_url TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active posts
CREATE POLICY "Allow public read access for active instagram_posts"
  ON instagram_posts
  FOR SELECT
  USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to instagram_posts"
  ON instagram_posts
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instagram_display_order ON instagram_posts(display_order);

-- Insert default data (from current hardcoded feed)
INSERT INTO instagram_posts (image_url, caption, post_url, likes_count, display_order, is_active)
VALUES 
  ('/gallery-1.jpg', 'Sunday vibes with the squad 🐾 #PebricStyle', 'https://instagram.com', 245, 1, true),
  ('/gallery-2.jpg', 'Twinning is winning! Shop the new collection now.', 'https://instagram.com', 189, 2, true),
  ('/gallery-3.jpg', 'Behind the scenes of our latest photoshoot.', 'https://instagram.com', 312, 3, true),
  ('/gallery-4.jpg', 'Customer spotlight: Look at how cute Max looks!', 'https://instagram.com', 567, 4, true)
ON CONFLICT DO NOTHING;

SELECT 'Phase 3 CMS tables created successfully' as status;
