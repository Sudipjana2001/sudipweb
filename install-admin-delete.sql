-- ============================================================================
-- INSTALL ADMIN DELETE FUNCTION (RPC)
-- ============================================================================
-- Creates a secure server-side function to delete products.
-- This bypasses Row Level Security (RLS) policies on the table,
-- ensuring that if you are an Admin, the delete WILL happen.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_product_admin(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges (bypassing table RLS)
SET search_path = public -- Security best practice
AS $$
DECLARE
  caller_id uuid;
  is_admin boolean;
BEGIN
  -- 1. Get current user ID
  caller_id := auth.uid();
  
  -- 2. Verify Admin Role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = caller_id 
    AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access Denied: Only admins can delete products.';
  END IF;

  -- 3. Perform Deletion
  -- (Constraints should already be fixed by previous script, but this ensures permissions don't block it)
  DELETE FROM public.products WHERE id = product_id;
  
END;
$$;

SELECT 'Admin delete function installed successfully' as status;
