-- Fix RLS policies for gallery_likes table
-- Run this in Supabase Dashboard > SQL Editor

-- Drop the existing policy that isn't working for INSERT
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.gallery_likes;

-- Create separate, explicit policies for each operation

-- Allow authenticated users to INSERT their own likes
CREATE POLICY "Users can insert their own likes"
  ON public.gallery_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own likes  
CREATE POLICY "Users can delete their own likes"
  ON public.gallery_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep the existing SELECT policy (anyone can view likes)
-- "Anyone can view likes" policy should already exist
-- If not, uncomment the line below:
-- CREATE POLICY "Anyone can view likes" ON public.gallery_likes FOR SELECT USING (true);

-- Ensure each user can only like a photo ONCE (unique constraint)
-- This should already exist, but adding IF NOT EXISTS for safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gallery_likes_user_id_gallery_post_id_key'
  ) THEN
    ALTER TABLE public.gallery_likes
      ADD CONSTRAINT gallery_likes_user_id_gallery_post_id_key 
      UNIQUE (user_id, gallery_post_id);
  END IF;
END $$;
