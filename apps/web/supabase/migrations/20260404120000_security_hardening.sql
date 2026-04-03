BEGIN;

-- Consolidate previously manual review helpful voting setup into a tracked migration.
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id),
    CONSTRAINT review_helpful_votes_review_id_user_id_key UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id
    ON public.review_helpful_votes USING btree (review_id);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id
    ON public.review_helpful_votes USING btree (user_id);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can insert their own helpful votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can delete their own helpful votes" ON public.review_helpful_votes;

CREATE POLICY "Anyone can view helpful votes"
ON public.review_helpful_votes
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own helpful votes"
ON public.review_helpful_votes
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    AND auth.uid() <> (
        SELECT reviews.user_id
        FROM public.reviews
        WHERE reviews.id = review_id
    )
);

CREATE POLICY "Users can delete their own helpful votes"
ON public.review_helpful_votes
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can update helpful count" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_review_id uuid := COALESCE(NEW.review_id, OLD.review_id);
BEGIN
  UPDATE public.reviews
  SET helpful_count = (
    SELECT COUNT(*)
    FROM public.review_helpful_votes
    WHERE review_helpful_votes.review_id = v_review_id
  )
  WHERE id = v_review_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_review_helpful_count_after_change ON public.review_helpful_votes;

CREATE TRIGGER sync_review_helpful_count_after_change
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.sync_review_helpful_count();

UPDATE public.reviews AS reviews
SET helpful_count = COALESCE(votes.vote_count, 0)
FROM (
  SELECT review_id, COUNT(*)::integer AS vote_count
  FROM public.review_helpful_votes
  GROUP BY review_id
) AS votes
WHERE votes.review_id = reviews.id;

UPDATE public.reviews
SET helpful_count = 0
WHERE helpful_count IS NULL;

CREATE OR REPLACE FUNCTION public.mark_review_helpful(p_review_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_review public.reviews%ROWTYPE;
  v_inserted_vote_id uuid;
  v_helpful_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_review
  FROM public.reviews
  WHERE id = p_review_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF v_review.user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot vote on your own review';
  END IF;

  INSERT INTO public.review_helpful_votes (review_id, user_id)
  VALUES (p_review_id, auth.uid())
  ON CONFLICT (review_id, user_id) DO NOTHING
  RETURNING id INTO v_inserted_vote_id;

  IF v_inserted_vote_id IS NULL THEN
    RAISE EXCEPTION 'You have already voted on this review';
  END IF;

  SELECT helpful_count
  INTO v_helpful_count
  FROM public.reviews
  WHERE id = p_review_id;

  RETURN COALESCE(v_helpful_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_review_summary(p_product_id uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(ROUND(AVG(reviews.rating)::numeric, 1), 0) AS average_rating,
    COUNT(*)::bigint AS total_reviews
  FROM public.reviews
  WHERE reviews.product_id = p_product_id
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit_and_increment(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer,
  p_window_minutes integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  retry_after integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_seconds integer := GREATEST(COALESCE(p_window_minutes, 1), 1) * 60;
  v_max_requests integer := GREATEST(COALESCE(p_max_requests, 1), 1);
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_rate_limit public.rate_limits%ROWTYPE;
BEGIN
  IF COALESCE(TRIM(p_identifier), '') = '' THEN
    RAISE EXCEPTION 'Identifier is required';
  END IF;

  IF COALESCE(TRIM(p_endpoint), '') = '' THEN
    RAISE EXCEPTION 'Endpoint is required';
  END IF;

  v_window_start :=
    to_timestamp(
      FLOOR(EXTRACT(EPOCH FROM now()) / v_window_seconds) * v_window_seconds
    );
  v_window_end := v_window_start + make_interval(secs => v_window_seconds);

  INSERT INTO public.rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, v_window_start)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE
    SET request_count = public.rate_limits.request_count + 1
  WHERE public.rate_limits.request_count < v_max_requests
  RETURNING * INTO v_rate_limit;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      true,
      GREATEST(v_max_requests - v_rate_limit.request_count, 0),
      GREATEST(CEIL(EXTRACT(EPOCH FROM (v_window_end - now())))::integer, 0);
    RETURN;
  END IF;

  SELECT *
  INTO v_rate_limit
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start = v_window_start;

  RETURN QUERY
  SELECT
    false,
    0,
    GREATEST(CEIL(EXTRACT(EPOCH FROM (v_window_end - now())))::integer, 0);
END;
$$;

-- Promote the previously manual admin delete RPC into migrations.
CREATE OR REPLACE FUNCTION public.delete_product_admin(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: only admins can delete products.';
  END IF;

  DELETE FROM public.products
  WHERE id = product_id;
END;
$$;

-- Add server-owned idempotency and transaction protections for checkout.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS checkout_idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_checkout_idempotency_key
ON public.orders (user_id, checkout_idempotency_key)
WHERE checkout_idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id
ON public.payments (transaction_id)
WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_uses_coupon_user_order
ON public.coupon_uses (coupon_id, user_id, order_id)
WHERE order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.add_cart_item(
  p_product_id uuid,
  p_size text,
  p_pet_size text,
  p_quantity integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_size text := COALESCE(NULLIF(p_size, ''), 'N/A');
  v_pet_size text := COALESCE(NULLIF(p_pet_size, ''), 'N/A');
  v_quantity integer := GREATEST(COALESCE(p_quantity, 1), 1);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.cart_items
  SET quantity = quantity + v_quantity
  WHERE user_id = v_user_id
    AND product_id = p_product_id
    AND COALESCE(NULLIF(size, ''), 'N/A') = v_size
    AND COALESCE(NULLIF(pet_size, ''), 'N/A') = v_pet_size;

  IF FOUND THEN
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.cart_items (user_id, product_id, quantity, size, pet_size)
    VALUES (v_user_id, p_product_id, v_quantity, v_size, v_pet_size);
  EXCEPTION
    WHEN unique_violation THEN
      UPDATE public.cart_items
      SET quantity = quantity + v_quantity
      WHERE user_id = v_user_id
        AND product_id = p_product_id
        AND COALESCE(NULLIF(size, ''), 'N/A') = v_size
        AND COALESCE(NULLIF(pet_size, ''), 'N/A') = v_pet_size;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_cart_item_quantity(
  p_product_id uuid,
  p_size text,
  p_pet_size text,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_size text := COALESCE(NULLIF(p_size, ''), 'N/A');
  v_pet_size text := COALESCE(NULLIF(p_pet_size, ''), 'N/A');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF COALESCE(p_quantity, 0) < 1 THEN
    DELETE FROM public.cart_items
    WHERE user_id = v_user_id
      AND product_id = p_product_id
      AND COALESCE(NULLIF(size, ''), 'N/A') = v_size
      AND COALESCE(NULLIF(pet_size, ''), 'N/A') = v_pet_size;
    RETURN;
  END IF;

  UPDATE public.cart_items
  SET quantity = p_quantity
  WHERE user_id = v_user_id
    AND product_id = p_product_id
    AND COALESCE(NULLIF(size, ''), 'N/A') = v_size
    AND COALESCE(NULLIF(pet_size, ''), 'N/A') = v_pet_size;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_cart_item(
  p_product_id uuid,
  p_size text,
  p_pet_size text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_size text := COALESCE(NULLIF(p_size, ''), 'N/A');
  v_pet_size text := COALESCE(NULLIF(p_pet_size, ''), 'N/A');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.cart_items
  WHERE user_id = v_user_id
    AND product_id = p_product_id
    AND COALESCE(NULLIF(size, ''), 'N/A') = v_size
    AND COALESCE(NULLIF(pet_size, ''), 'N/A') = v_pet_size;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_checkout(
  p_items jsonb,
  p_payment_method text,
  p_shipping_address jsonb,
  p_billing_address jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_gift_wrap boolean DEFAULT false,
  p_gift_message text DEFAULT NULL,
  p_clear_cart boolean DEFAULT true,
  p_coupon_id uuid DEFAULT NULL,
  p_transaction_id text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_order public.orders%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_coupon public.coupons%ROWTYPE;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_product_id uuid;
  v_quantity integer;
  v_owner_size text;
  v_pet_size text;
  v_unit_price numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_shipping_cost numeric(10,2);
  v_taxable_amount numeric(10,2);
  v_tax numeric(10,2);
  v_cod_fee numeric(10,2);
  v_total numeric(10,2);
  v_gift_wrap_price numeric(10,2) := CASE WHEN COALESCE(p_gift_wrap, false) THEN 5 ELSE 0 END;
  v_coupon_discount numeric(10,2) := 0;
  v_coupon_uses_by_user integer := 0;
  v_has_coupon_match boolean := false;
  v_ordered_product_ids uuid[] := ARRAY[]::uuid[];
  v_ordered_category_ids uuid[] := ARRAY[]::uuid[];
  v_ordered_collection_ids uuid[] := ARRAY[]::uuid[];
  v_payment_method text := COALESCE(NULLIF(p_payment_method, ''), 'cod');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be logged in';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT *
    INTO v_existing_order
    FROM public.orders
    WHERE user_id = v_user_id
      AND checkout_idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN v_existing_order;
    END IF;
  END IF;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'productId', '')::uuid;
    v_quantity := GREATEST(COALESCE((v_item ->> 'quantity')::integer, 1), 1);
    v_owner_size := COALESCE(NULLIF(v_item ->> 'size', ''), 'N/A');
    v_pet_size := COALESCE(NULLIF(v_item ->> 'petSize', ''), 'N/A');

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Each order item must include a product ID';
    END IF;

    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND OR COALESCE(v_product.is_active, false) = false THEN
      RAISE EXCEPTION 'One or more products are unavailable';
    END IF;

    IF COALESCE(v_product.stock, 0) < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_product.name;
    END IF;

    v_unit_price := CASE
      WHEN v_owner_size <> 'N/A' AND v_pet_size <> 'N/A'
        THEN COALESCE(v_product.price, 0)
      ELSE ROUND(COALESCE(v_product.price, 0) * 0.5, 0)
    END;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
    v_ordered_product_ids := array_append(v_ordered_product_ids, v_product.id);

    IF v_product.category_id IS NOT NULL THEN
      v_ordered_category_ids := array_append(v_ordered_category_ids, v_product.category_id);
    END IF;

    IF v_product.collection_id IS NOT NULL THEN
      v_ordered_collection_ids := array_append(v_ordered_collection_ids, v_product.collection_id);
    END IF;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    SELECT *
    INTO v_coupon
    FROM public.coupons
    WHERE id = p_coupon_id
    FOR UPDATE;

    IF NOT FOUND OR COALESCE(v_coupon.is_active, false) = false THEN
      RAISE EXCEPTION 'Coupon is not available';
    END IF;

    IF v_coupon.starts_at > now() THEN
      RAISE EXCEPTION 'Coupon is not active yet';
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'Coupon has expired';
    END IF;

    IF COALESCE(v_coupon.max_uses, 0) > 0 AND COALESCE(v_coupon.uses_count, 0) >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Coupon usage limit has been reached';
    END IF;

    IF v_subtotal < COALESCE(v_coupon.min_order_amount, 0) THEN
      RAISE EXCEPTION 'Coupon minimum order amount not met';
    END IF;

    SELECT COUNT(*)::integer
    INTO v_coupon_uses_by_user
    FROM public.coupon_uses
    WHERE coupon_id = v_coupon.id
      AND user_id = v_user_id;

    IF COALESCE(v_coupon.max_uses_per_user, 0) > 0
       AND v_coupon_uses_by_user >= v_coupon.max_uses_per_user THEN
      RAISE EXCEPTION 'You have already used this coupon';
    END IF;

    IF v_coupon.applies_to = 'all' THEN
      v_has_coupon_match := true;
    ELSIF v_coupon.applies_to = 'product' THEN
      v_has_coupon_match := COALESCE(
        v_ordered_product_ids && COALESCE(v_coupon.applies_to_ids, ARRAY[]::uuid[]),
        false
      );
    ELSIF v_coupon.applies_to = 'category' THEN
      v_has_coupon_match := COALESCE(
        v_ordered_category_ids && COALESCE(v_coupon.applies_to_ids, ARRAY[]::uuid[]),
        false
      );
    ELSIF v_coupon.applies_to = 'collection' THEN
      v_has_coupon_match := COALESCE(
        v_ordered_collection_ids && COALESCE(v_coupon.applies_to_ids, ARRAY[]::uuid[]),
        false
      );
    END IF;

    IF NOT v_has_coupon_match THEN
      RAISE EXCEPTION 'Coupon does not apply to this order';
    END IF;

    v_coupon_discount := CASE
      WHEN v_coupon.discount_type = 'percentage'
        THEN ROUND((v_subtotal * v_coupon.discount_value) / 100, 2)
      ELSE LEAST(v_coupon.discount_value, v_subtotal)
    END;
  END IF;

  v_shipping_cost := CASE
    WHEN v_subtotal >= 100 THEN 0
    ELSE 10
  END;

  v_cod_fee := CASE
    WHEN v_payment_method = 'cod' THEN 11
    ELSE 0
  END;

  v_taxable_amount := GREATEST(0, v_subtotal - v_coupon_discount + v_gift_wrap_price);
  v_tax := ROUND(v_taxable_amount * 0.08, 2);
  v_total := ROUND(v_taxable_amount + v_shipping_cost + v_tax + v_cod_fee, 2);

  BEGIN
    INSERT INTO public.orders (
      user_id,
      status,
      subtotal,
      shipping_cost,
      tax,
      total,
      shipping_address,
      billing_address,
      notes,
      gift_wrap,
      gift_message,
      gift_wrap_price,
      payment_method,
      payment_status,
      payment_id,
      checkout_idempotency_key
    )
    VALUES (
      v_user_id,
      'confirmed',
      v_subtotal,
      v_shipping_cost,
      v_tax,
      v_total,
      p_shipping_address,
      COALESCE(p_billing_address, p_shipping_address),
      p_notes,
      COALESCE(p_gift_wrap, false),
      CASE WHEN COALESCE(p_gift_wrap, false) THEN p_gift_message ELSE NULL END,
      v_gift_wrap_price,
      v_payment_method,
      COALESCE(
        NULLIF(p_payment_status, ''),
        CASE WHEN v_payment_method = 'cod' THEN 'pending' ELSE 'processing' END
      ),
      p_transaction_id,
      p_idempotency_key
    )
    RETURNING *
    INTO v_order;
  EXCEPTION
    WHEN unique_violation THEN
      IF p_idempotency_key IS NOT NULL THEN
        SELECT *
        INTO v_existing_order
        FROM public.orders
        WHERE user_id = v_user_id
          AND checkout_idempotency_key = p_idempotency_key
        LIMIT 1;

        IF FOUND THEN
          RETURN v_existing_order;
        END IF;
      END IF;

      RAISE;
  END;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item ->> 'productId', '')::uuid;
    v_quantity := GREATEST(COALESCE((v_item ->> 'quantity')::integer, 1), 1);
    v_owner_size := COALESCE(NULLIF(v_item ->> 'size', ''), 'N/A');
    v_pet_size := COALESCE(NULLIF(v_item ->> 'petSize', ''), 'N/A');

    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    v_unit_price := CASE
      WHEN v_owner_size <> 'N/A' AND v_pet_size <> 'N/A'
        THEN COALESCE(v_product.price, 0)
      ELSE ROUND(COALESCE(v_product.price, 0) * 0.5, 0)
    END;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_image,
      quantity,
      size,
      pet_size,
      unit_price,
      total_price
    )
    VALUES (
      v_order.id,
      v_product.id,
      v_product.name,
      COALESCE(v_product.image_url, v_product.images[1]),
      v_quantity,
      v_owner_size,
      v_pet_size,
      v_unit_price,
      v_unit_price * v_quantity
    );

    UPDATE public.products
    SET stock = GREATEST(COALESCE(stock, 0) - v_quantity, 0),
        is_active = CASE
          WHEN GREATEST(COALESCE(stock, 0) - v_quantity, 0) = 0 THEN false
          ELSE is_active
        END
    WHERE id = v_product.id;
  END LOOP;

  INSERT INTO public.payments (
    order_id,
    user_id,
    amount,
    payment_method,
    payment_status,
    transaction_id
  )
  VALUES (
    v_order.id,
    v_user_id,
    v_total,
    v_payment_method,
    COALESCE(
      NULLIF(p_payment_status, ''),
      CASE WHEN v_payment_method = 'cod' THEN 'pending' ELSE 'processing' END
    ),
    p_transaction_id
  );

  IF p_coupon_id IS NOT NULL AND v_coupon_discount > 0 THEN
    INSERT INTO public.coupon_uses (
      coupon_id,
      user_id,
      order_id,
      discount_applied
    )
    VALUES (
      p_coupon_id,
      v_user_id,
      v_order.id,
      v_coupon_discount
    );

    UPDATE public.coupons
    SET uses_count = COALESCE(uses_count, 0) + 1
    WHERE id = p_coupon_id;
  END IF;

  IF COALESCE(p_clear_cart, true) THEN
    DELETE FROM public.cart_items
    WHERE user_id = v_user_id;
  END IF;

  RETURN v_order;
END;
$$;

-- Version storage bucket policies in migrations so environments stay aligned.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('review-photos', 'review-photos', true),
  ('avatars', 'avatars', true),
  ('gallery-images', 'gallery-images', true),
  ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- storage.objects is managed by Supabase Storage and already has RLS enabled.
-- Attempting to ALTER the table here can fail because the migration role does
-- not own the managed storage table in hosted projects.

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Pet Photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pet photos" ON storage.objects;
DROP POLICY IF EXISTS "rp_select_public_20260127" ON storage.objects;
DROP POLICY IF EXISTS "rp_insert_auth_20260127" ON storage.objects;
DROP POLICY IF EXISTS "rp_update_auth_20260127" ON storage.objects;
DROP POLICY IF EXISTS "rp_delete_auth_20260127" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public_20260127" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_auth_20260127" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_auth_20260127" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_auth_20260127" ON storage.objects;

DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "review_photos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "review_photos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "review_photos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "review_photos_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "gallery_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "gallery_images_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "gallery_images_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "pet_photos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "pet_photos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "pet_photos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "pet_photos_owner_delete" ON storage.objects;

CREATE POLICY "product_images_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "product_images_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "product_images_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "review_photos_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "review_photos_owner_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "review_photos_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'review-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "review_photos_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'review-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "gallery_images_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery-images');

CREATE POLICY "gallery_images_owner_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "gallery_images_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'gallery-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "gallery_images_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'gallery-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "pet_photos_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-photos');

CREATE POLICY "pet_photos_owner_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pet-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "pet_photos_owner_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pet-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "pet_photos_owner_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pet-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
