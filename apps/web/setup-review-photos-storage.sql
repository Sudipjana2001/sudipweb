-- ============================================================================
-- SETUP REVIEW PHOTOS STORAGE BUCKET
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop ALL existing policies that might conflict
-- (These are the auto-generated ones from failed attempts)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND (policyname ILIKE '%review%photo%' OR policyname ILIKE '%review_photos%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Create fresh policies with unique names

-- SELECT: Public can view all review photos
CREATE POLICY "rp_select_public_20260127"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

-- INSERT: Authenticated users can upload to their own folder
CREATE POLICY "rp_insert_auth_20260127"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'review-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Users can update their own photos
CREATE POLICY "rp_update_auth_20260127"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'review-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Users can delete their own photos
CREATE POLICY "rp_delete_auth_20260127"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'review-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

SELECT 'Review Photos Storage setup complete!' as status;
