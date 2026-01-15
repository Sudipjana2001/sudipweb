-- Enable RLS on the pets table
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts or duplicates
DROP POLICY IF EXISTS "Users can view their own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can create their own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can update their own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can delete their own pets" ON public.pets;

-- Create Policies

-- 1. SELECT: Users can only see their own pets
CREATE POLICY "Users can view their own pets"
ON public.pets
FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT: Users can create pets, but only if they assign themselves as the owner
CREATE POLICY "Users can create their own pets"
ON public.pets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own pets
CREATE POLICY "Users can update their own pets"
ON public.pets
FOR UPDATE
USING (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own pets
CREATE POLICY "Users can delete their own pets"
ON public.pets
FOR DELETE
USING (auth.uid() = user_id);
