-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (it should be on by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Public Access to Pet Photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pet photos" ON storage.objects;

-- 4. Create Policies

-- SELECT: Allow public access to view photos (so they show up in the app)
CREATE POLICY "Public Access to Pet Photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pet-photos' );

-- INSERT: Allow authenticated users to upload files
-- We restrict the path to be inside a folder named after their user ID for security
CREATE POLICY "Users can upload their own pet photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-photos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Allow users to update their own files
CREATE POLICY "Users can update their own pet photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Allow users to delete their own files
CREATE POLICY "Users can delete their own pet photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
