BEGIN;

-- Some environments may miss this shared helper if older bootstrap migrations
-- were not applied through the normal chain. Define it here so the outbox
-- trigger can be installed safely.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.event_outbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topic text NOT NULL,
    event_type text NOT NULL,
    aggregate_type text NOT NULL,
    aggregate_id uuid,
    partition_key text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    headers jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    published_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_outbox_pkey PRIMARY KEY (id),
    CONSTRAINT event_outbox_status_check CHECK (
      status = ANY (ARRAY['pending'::text, 'processing'::text, 'published'::text, 'dead_letter'::text])
    )
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_dispatch
    ON public.event_outbox (status, next_attempt_at, created_at);

CREATE INDEX IF NOT EXISTS idx_event_outbox_topic_status
    ON public.event_outbox (topic, status, created_at);

CREATE INDEX IF NOT EXISTS idx_event_outbox_aggregate
    ON public.event_outbox (aggregate_type, aggregate_id, created_at);

ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.event_outbox FROM PUBLIC;
REVOKE ALL ON TABLE public.event_outbox FROM anon;
REVOKE ALL ON TABLE public.event_outbox FROM authenticated;

DROP TRIGGER IF EXISTS update_event_outbox_updated_at ON public.event_outbox;

CREATE TRIGGER update_event_outbox_updated_at
BEFORE UPDATE ON public.event_outbox
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enqueue_outbox_event(
  p_topic text,
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id uuid DEFAULT NULL,
  p_partition_key text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_headers jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF COALESCE(TRIM(p_topic), '') = '' THEN
    RAISE EXCEPTION 'Topic is required';
  END IF;

  IF COALESCE(TRIM(p_event_type), '') = '' THEN
    RAISE EXCEPTION 'Event type is required';
  END IF;

  IF COALESCE(TRIM(p_aggregate_type), '') = '' THEN
    RAISE EXCEPTION 'Aggregate type is required';
  END IF;

  INSERT INTO public.event_outbox (
    topic,
    event_type,
    aggregate_type,
    aggregate_id,
    partition_key,
    payload,
    headers
  )
  VALUES (
    p_topic,
    p_event_type,
    p_aggregate_type,
    p_aggregate_id,
    p_partition_key,
    COALESCE(p_payload, '{}'::jsonb),
    COALESCE(p_headers, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_outbox_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record jsonb := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  v_aggregate_type text := COALESCE(NULLIF(TG_ARGV[1], ''), TG_TABLE_NAME);
  v_topic text := COALESCE(NULLIF(TG_ARGV[0], ''), TG_TABLE_NAME);
  v_aggregate_id_column text := COALESCE(NULLIF(TG_ARGV[2], ''), 'id');
  v_partition_key_column text := COALESCE(NULLIF(TG_ARGV[3], ''), v_aggregate_id_column);
  v_event_suffix text;
  v_aggregate_id uuid;
  v_partition_key text;
BEGIN
  v_event_suffix := CASE TG_OP
    WHEN 'INSERT' THEN 'created'
    WHEN 'UPDATE' THEN 'updated'
    WHEN 'DELETE' THEN 'deleted'
    ELSE lower(TG_OP)
  END;

  IF NULLIF(v_record ->> v_aggregate_id_column, '') IS NOT NULL THEN
    v_aggregate_id := (v_record ->> v_aggregate_id_column)::uuid;
  END IF;

  v_partition_key := NULLIF(v_record ->> v_partition_key_column, '');

  PERFORM public.enqueue_outbox_event(
    p_topic => v_topic,
    p_event_type => format('%s.%s', v_aggregate_type, v_event_suffix),
    p_aggregate_type => v_aggregate_type,
    p_aggregate_id => v_aggregate_id,
    p_partition_key => COALESCE(v_partition_key, v_aggregate_id::text),
    p_payload => jsonb_strip_nulls(
      jsonb_build_object(
        'schema', TG_TABLE_SCHEMA,
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'record', v_record,
        'previous_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        'occurred_at', now()
      )
    ),
    p_headers => jsonb_strip_nulls(
      jsonb_build_object(
        'source', 'supabase.postgres',
        'table', TG_TABLE_NAME,
        'operation', lower(TG_OP)
      )
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_event_outbox_batch(
  p_consumer_name text,
  p_batch_size integer DEFAULT 50,
  p_stale_after_seconds integer DEFAULT 300
)
RETURNS SETOF public.event_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(TRIM(p_consumer_name), '') = '' THEN
    RAISE EXCEPTION 'Consumer name is required';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.event_outbox
    WHERE (
      status = 'pending'
      AND next_attempt_at <= now()
    ) OR (
      status = 'processing'
      AND locked_at IS NOT NULL
      AND locked_at <= now() - make_interval(secs => GREATEST(COALESCE(p_stale_after_seconds, 300), 30))
    )
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(COALESCE(p_batch_size, 50), 1)
  ),
  claimed AS (
    UPDATE public.event_outbox AS event_outbox
    SET status = 'processing',
        locked_at = now(),
        locked_by = p_consumer_name,
        updated_at = now()
    WHERE event_outbox.id IN (SELECT candidates.id FROM candidates)
    RETURNING event_outbox.*
  )
  SELECT * FROM claimed ORDER BY created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_event_outbox_published(p_event_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  IF COALESCE(array_length(p_event_ids, 1), 0) = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.event_outbox
  SET status = 'published',
      published_at = now(),
      locked_at = NULL,
      locked_by = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = ANY (p_event_ids);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_event_outbox_failed(
  p_event_id uuid,
  p_error text,
  p_retry_delay_seconds integer DEFAULT 60,
  p_dead_letter boolean DEFAULT false
)
RETURNS public.event_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event public.event_outbox%ROWTYPE;
BEGIN
  UPDATE public.event_outbox
  SET status = CASE
        WHEN COALESCE(p_dead_letter, false) THEN 'dead_letter'
        ELSE 'pending'
      END,
      attempts = attempts + 1,
      next_attempt_at = CASE
        WHEN COALESCE(p_dead_letter, false) THEN now()
        ELSE now() + make_interval(secs => GREATEST(COALESCE(p_retry_delay_seconds, 60), 1))
      END,
      locked_at = NULL,
      locked_by = NULL,
      last_error = LEFT(COALESCE(p_error, 'Unknown publish error'), 4000),
      updated_at = now()
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_outbox_event(text, text, text, uuid, text, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.capture_outbox_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_event_outbox_batch(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_event_outbox_published(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_event_outbox_failed(uuid, text, integer, boolean) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.enqueue_outbox_event(text, text, text, uuid, text, jsonb, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.capture_outbox_event() FROM anon;
REVOKE ALL ON FUNCTION public.claim_event_outbox_batch(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.mark_event_outbox_published(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.mark_event_outbox_failed(uuid, text, integer, boolean) FROM anon;

REVOKE ALL ON FUNCTION public.enqueue_outbox_event(text, text, text, uuid, text, jsonb, jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION public.capture_outbox_event() FROM authenticated;
REVOKE ALL ON FUNCTION public.claim_event_outbox_batch(text, integer, integer) FROM authenticated;
REVOKE ALL ON FUNCTION public.mark_event_outbox_published(uuid[]) FROM authenticated;
REVOKE ALL ON FUNCTION public.mark_event_outbox_failed(uuid, text, integer, boolean) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.claim_event_outbox_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_event_outbox_published(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_event_outbox_failed(uuid, text, integer, boolean) TO service_role;

DROP TRIGGER IF EXISTS capture_orders_outbox_event ON public.orders;
DROP TRIGGER IF EXISTS capture_order_items_outbox_event ON public.order_items;
DROP TRIGGER IF EXISTS capture_payments_outbox_event ON public.payments;
DROP TRIGGER IF EXISTS capture_reviews_outbox_event ON public.reviews;
DROP TRIGGER IF EXISTS capture_review_helpful_votes_outbox_event ON public.review_helpful_votes;

CREATE TRIGGER capture_orders_outbox_event
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.capture_outbox_event('orders', 'order', 'id', 'id');

CREATE TRIGGER capture_order_items_outbox_event
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.capture_outbox_event('order-items', 'order_item', 'id', 'order_id');

CREATE TRIGGER capture_payments_outbox_event
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.capture_outbox_event('payments', 'payment', 'id', 'order_id');

CREATE TRIGGER capture_reviews_outbox_event
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.capture_outbox_event('reviews', 'review', 'id', 'product_id');

CREATE TRIGGER capture_review_helpful_votes_outbox_event
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION public.capture_outbox_event('review-helpful-votes', 'review_helpful_vote', 'id', 'review_id');

COMMIT;
