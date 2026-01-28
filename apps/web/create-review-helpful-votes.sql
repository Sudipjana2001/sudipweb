-- ============================================================================
-- CREATE REVIEW HELPFUL VOTES TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create the review_helpful_votes table
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON public.review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON public.review_helpful_votes(user_id);

-- 3. Enable RLS on review_helpful_votes table
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.review_helpful_votes;

-- 5. Create RLS policies

-- SELECT: Anyone can view votes
CREATE POLICY "Anyone can view helpful votes"
ON public.review_helpful_votes FOR SELECT
USING (true);

-- INSERT: Authenticated users can insert their own votes
CREATE POLICY "Users can insert their own votes"
ON public.review_helpful_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own votes (to allow un-voting)
CREATE POLICY "Users can delete their own votes"
ON public.review_helpful_votes FOR DELETE
USING (auth.uid() = user_id);

-- 6. Update reviews table to allow anyone to update helpful_count
-- We need a special policy for this since the mutation will increment the count
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can update helpful count" ON public.reviews;

-- Recreate the user update policy
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update helpful_count on any review
CREATE POLICY "Anyone can update helpful count"
ON public.reviews FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

SELECT 'Review helpful votes table created successfully!' as status;
