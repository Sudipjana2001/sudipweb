-- ============================================================================
-- SETUP STORAGE BUCKETS
-- ============================================================================
-- Creates the 'product-images' bucket for image uploads
-- ============================================================================

-- 1. Create the Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Security)
-- (Buckets usually have RLS enabled by default, but good to ensure)

-- 3. Create POLICIES (Allow Access)

-- Allow Public READ access (so users can see images)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product-images' );

-- Allow Authenticated Users to UPLOAD (Insert)
CREATE POLICY "Authenticated Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated' 
);

-- Allow Authenticated Users to UPDATE/DELETE (Manage images)
CREATE POLICY "Authenticated Updates" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated' 
);

CREATE POLICY "Authenticated Deletes" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated' 
);

SELECT 'Storage Bucket setup complete!' as status;
