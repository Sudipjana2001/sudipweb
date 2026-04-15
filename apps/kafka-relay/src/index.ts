import "dotenv/config";

import { hostname } from "node:os";
import process from "node:process";

import { Kafka, logLevel, type SASLOptions } from "kafkajs";
import { createClient } from "@supabase/supabase-js";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface OutboxEvent {
  id: string;
  topic: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string | null;
  partition_key: string | null;
  payload: JsonValue;
  headers: Record<string, JsonValue> | null;
  attempts: number;
}

type KafkaSaslConfig =
  | {
      mechanism: "plain";
      username: string;
      password: string;
    }
  | {
      mechanism: "scram-sha-256";
      username: string;
      password: string;
    }
  | {
      mechanism: "scram-sha-512";
      username: string;
      password: string;
    };

interface Config {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaConsumerName: string;
  kafkaTopicPrefix: string;
  kafkaSsl: boolean;
  kafkaSasl?: KafkaSaslConfig;
  outboxBatchSize: number;
  outboxPollIntervalMs: number;
  outboxMaxAttempts: number;
  outboxFailureBackoffSeconds: number;
  outboxStaleAfterSeconds: number;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getNumberEnv(name: string, fallback: number): number {
  const value = getOptionalEnv(name);

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return parsed;
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const value = getOptionalEnv(name);

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function getKafkaSaslConfig(): Config["kafkaSasl"] {
  const mechanism = getOptionalEnv("KAFKA_SASL_MECHANISM");
  if (!mechanism) {
    return undefined;
  }

  const username = getRequiredEnv("KAFKA_SASL_USERNAME");
  const password = getRequiredEnv("KAFKA_SASL_PASSWORD");

  switch (mechanism) {
    case "plain":
      return { mechanism, username, password };
    case "scram-sha-256":
      return { mechanism, username, password };
    case "scram-sha-512":
      return { mechanism, username, password };
    default:
      throw new Error(
        "KAFKA_SASL_MECHANISM must be one of: plain, scram-sha-256, scram-sha-512",
      );
  }
}

function loadConfig(): Config {
  const kafkaBrokers = getRequiredEnv("KAFKA_BROKERS")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

  if (kafkaBrokers.length === 0) {
    throw new Error("KAFKA_BROKERS must contain at least one broker");
  }

  return {
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    kafkaBrokers,
    kafkaClientId: getOptionalEnv("KAFKA_CLIENT_ID") ?? "pebric-kafka-relay",
    kafkaConsumerName:
      getOptionalEnv("KAFKA_CONSUMER_NAME") ?? `${hostname()}-${process.pid}`,
    kafkaTopicPrefix: getOptionalEnv("KAFKA_TOPIC_PREFIX") ?? "",
    kafkaSsl: getBooleanEnv("KAFKA_SSL", false),
    kafkaSasl: getKafkaSaslConfig(),
    outboxBatchSize: getNumberEnv("OUTBOX_BATCH_SIZE", 25),
    outboxPollIntervalMs: getNumberEnv("OUTBOX_POLL_INTERVAL_MS", 2000),
    outboxMaxAttempts: getNumberEnv("OUTBOX_MAX_ATTEMPTS", 10),
    outboxFailureBackoffSeconds: getNumberEnv(
      "OUTBOX_FAILURE_BACKOFF_SECONDS",
      30,
    ),
    outboxStaleAfterSeconds: getNumberEnv("OUTBOX_STALE_AFTER_SECONDS", 300),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

function resolveTopicName(config: Config, topic: string) {
  return config.kafkaTopicPrefix
    ? `${config.kafkaTopicPrefix}.${topic}`
    : topic;
}

function normalizeHeaders(
  event: OutboxEvent,
): Record<string, string | Buffer | undefined> {
  const headers: Record<string, string | Buffer | undefined> = {};

  Object.entries(event.headers ?? {}).forEach(([key, value]) => {
    if (value === null || typeof value === "undefined") {
      return;
    }

    headers[key] =
      typeof value === "string" ? value : JSON.stringify(value);
  });

  headers.event_id = event.id;
  headers.event_type = event.event_type;
  headers.aggregate_type = event.aggregate_type;
  headers.aggregate_id = event.aggregate_id ?? undefined;
  headers.partition_key = event.partition_key ?? undefined;

  return headers;
}

function buildMessageValue(event: OutboxEvent) {
  return JSON.stringify({
    event_id: event.id,
    event_type: event.event_type,
    aggregate_type: event.aggregate_type,
    aggregate_id: event.aggregate_id,
    partition_key: event.partition_key,
    payload: event.payload,
  });
}

async function main() {
  const config = loadConfig();
  const supabase = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const kafka = new Kafka({
    clientId: config.kafkaClientId,
    brokers: config.kafkaBrokers,
    ssl: config.kafkaSsl,
    sasl: config.kafkaSasl,
    logLevel: logLevel.INFO,
  });

  const producer = kafka.producer();

  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`[kafka-relay] Received ${signal}, shutting down...`);
    await producer.disconnect();
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  await producer.connect();
  console.log(
    `[kafka-relay] Connected to Kafka as ${config.kafkaConsumerName}.`,
  );

  while (!shuttingDown) {
    const { data: events, error } = await supabase.rpc(
      "claim_event_outbox_batch",
      {
        p_consumer_name: config.kafkaConsumerName,
        p_batch_size: config.outboxBatchSize,
        p_stale_after_seconds: config.outboxStaleAfterSeconds,
      },
    );

    if (error) {
      console.error("[kafka-relay] Failed to claim outbox batch:", error);
      await sleep(config.outboxPollIntervalMs);
      continue;
    }

    const batch = (events ?? []) as OutboxEvent[];

    if (batch.length === 0) {
      await sleep(config.outboxPollIntervalMs);
      continue;
    }

    for (const event of batch) {
      if (shuttingDown) {
        break;
      }

      const topic = resolveTopicName(config, event.topic);

      try {
        await producer.send({
          topic,
          messages: [
            {
              key: event.partition_key ?? event.aggregate_id ?? event.id,
              headers: normalizeHeaders(event),
              value: buildMessageValue(event),
            },
          ],
        });

        const { error: markPublishedError } = await supabase.rpc(
          "mark_event_outbox_published",
          {
            p_event_ids: [event.id],
          },
        );

        if (markPublishedError) {
          throw new Error(markPublishedError.message);
        }

        console.log(
          `[kafka-relay] Published ${event.event_type} to ${topic} (${event.id}).`,
        );
      } catch (error) {
        const message = serializeError(error);
        const nextAttempt = event.attempts + 1;
        const deadLetter = nextAttempt >= config.outboxMaxAttempts;
        const retryDelaySeconds =
          config.outboxFailureBackoffSeconds * nextAttempt;

        console.error(
          `[kafka-relay] Failed to publish ${event.id}: ${message}`,
        );

        const { error: markFailedError } = await supabase.rpc(
          "mark_event_outbox_failed",
          {
            p_event_id: event.id,
            p_error: message,
            p_retry_delay_seconds: retryDelaySeconds,
            p_dead_letter: deadLetter,
          },
        );

        if (markFailedError) {
          console.error(
            `[kafka-relay] Failed to mark ${event.id} as failed: ${markFailedError.message}`,
          );
        }
      }
    }
  }
}

main().catch((error) => {
  console.error("[kafka-relay] Fatal startup error:", error);
  process.exitCode = 1;
});
