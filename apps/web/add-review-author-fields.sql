-- ============================================================================
-- Add public author fields to reviews (so reviews can show author name/avatar
-- without exposing full profiles to everyone).
-- Run this in Supabase SQL Editor.
-- ============================================================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_avatar_url text;

-- Backfill existing reviews from profiles (optional but recommended)
UPDATE public.reviews r
SET
  author_name = COALESCE(r.author_name, p.full_name, p.email),
  author_avatar_url = COALESCE(r.author_avatar_url, p.avatar_url)
FROM public.profiles p
WHERE p.id = r.user_id
  AND (r.author_name IS NULL OR r.author_avatar_url IS NULL);

SELECT 'Review author fields added/backfilled!' AS status;
