-- ============================================================================
-- SETUP AVATARS STORAGE BUCKET
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop any conflicting policies first
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname ILIKE '%avatar%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. Create policies

-- SELECT: Public can view all avatars
CREATE POLICY "avatars_select_public_20260127"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT: Authenticated users can upload to their own folder
CREATE POLICY "avatars_insert_auth_20260127"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Users can update their own avatars
CREATE POLICY "avatars_update_auth_20260127"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Users can delete their own avatars
CREATE POLICY "avatars_delete_auth_20260127"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

SELECT 'Avatars Storage setup complete!' as status;
