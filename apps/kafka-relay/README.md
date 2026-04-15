# Kafka Relay

This worker publishes Pebric domain events from Supabase into Kafka using a transactional outbox.

## What it publishes

After the `20260415103000_kafka_outbox.sql` migration is applied, these tables enqueue events automatically:

- `orders`
- `order_items`
- `payments`
- `reviews`
- `review_helpful_votes`

Each event is first written to `public.event_outbox` inside the same database transaction as the source write. The relay then claims pending rows and publishes them to Kafka.

## Environment

Copy `.env.example` to `.env` or inject the same variables in your process manager.

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KAFKA_BROKERS`

Optional:

- `KAFKA_CLIENT_ID`
- `KAFKA_CONSUMER_NAME`
- `KAFKA_TOPIC_PREFIX`
- `KAFKA_SSL`
- `KAFKA_SASL_MECHANISM`
- `KAFKA_SASL_USERNAME`
- `KAFKA_SASL_PASSWORD`
- `OUTBOX_BATCH_SIZE`
- `OUTBOX_POLL_INTERVAL_MS`
- `OUTBOX_MAX_ATTEMPTS`
- `OUTBOX_FAILURE_BACKOFF_SECONDS`
- `OUTBOX_STALE_AFTER_SECONDS`

## Run

From the repo root:

```bash
npm run kafka:relay
```

Build only:

```bash
npm run kafka:relay:build
```

Type-check only:

```bash
npm run kafka:relay:check
```

## Delivery semantics

Publishing is at-least-once. If Kafka accepts a message but the relay crashes before the outbox row is marked as published, the event can be sent again after recovery. Consumers should treat `event_id` as an idempotency key.
