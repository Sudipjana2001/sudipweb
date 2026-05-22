-- Enable RLS on the saved_addresses table if not already enabled
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors when recreating
DROP POLICY IF EXISTS "Users can insert their own addresses." ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can select their own addresses." ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses." ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses." ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can insert their own address" ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can update their own address" ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can delete their own address" ON public.saved_addresses;

-- Create comprehensive CRUD policies
CREATE POLICY "Users can insert their own addresses."
  ON public.saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own addresses."
  ON public.saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses."
  ON public.saved_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses."
  ON public.saved_addresses FOR DELETE
  USING (auth.uid() = user_id);
