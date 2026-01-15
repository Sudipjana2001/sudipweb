-- ============================================================================
-- CMS Phase 2: Testimonials Table
-- ============================================================================

-- 3. TESTIMONIALS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS testimonials_cms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  location TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  review_text TEXT NOT NULL,
  pet_name TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials_cms ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active testimonials
CREATE POLICY "Allow public read access for active testimonials"
  ON testimonials_cms
  FOR SELECT
  USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to testimonials"
  ON testimonials_cms
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials_cms(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials_cms(is_active);

-- Insert default data (from current hardcoded testimonials)
INSERT INTO testimonials_cms (customer_name, location, rating, review_text, pet_name, image_url, display_order, is_active)
VALUES 
  ('Sarah Mitchell', 'New York, NY', 5, 'Finally found a brand that understands the bond between me and my golden retriever. The quality is exceptional, and we get so many compliments when we go out!', 'Max', '/testimonial-1.jpg', 1, true),
  ('James Chen', 'San Francisco, CA', 5, 'The attention to detail is incredible. My French bulldog loves wearing his matching outfits, and the fabric is so soft. Worth every penny.', 'Bruno', '/testimonial-2.jpg', 2, true),
  ('Emma Rodriguez', 'Austin, TX', 5, 'I was skeptical at first, but these are genuinely the most comfortable pet clothes we''ve tried. Luna actually gets excited when she sees her matching hoodie!', 'Luna', '/testimonial-3.jpg', 3, true),
  ('Michael Park', 'Seattle, WA', 5, 'The winter collection saved our daily walks. Both my pup and I stay warm and stylish. The customer service team was also incredibly helpful with sizing.', 'Coco', '/testimonial-4.jpg', 4, true)
ON CONFLICT DO NOTHING;

SELECT 'Phase 2 CMS tables created successfully' as status;
