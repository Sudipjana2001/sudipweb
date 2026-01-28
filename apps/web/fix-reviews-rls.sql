-- ============================================================================
-- FIX REVIEWS TABLE RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- 3. Create fresh policies

-- SELECT: Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

-- INSERT: Authenticated users can create reviews
CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

SELECT 'Reviews RLS policies fixed!' as status;
