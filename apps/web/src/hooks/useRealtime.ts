import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/client";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimeSubscription {
  schema?: string;
  table: string;
  event?: PostgresChangeEvent;
  filter?: string;
}

/**
 * Small helper to subscribe to Supabase Realtime Postgres changes.
 * Keeps components consistent and avoids leaking channels.
 */
export function useRealtimeChannel(
  channelName: string,
  subscriptions: RealtimeSubscription[],
  onChange: () => void,
  enabled: boolean = true,
) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;
    if (!subscriptions || subscriptions.length === 0) return;

    const channel = supabase.channel(channelName);

    subscriptions.forEach((sub) => {
      channel.on(
        "postgres_changes",
        {
          event: sub.event || "*",
          schema: sub.schema || "public",
          table: sub.table,
          filter: sub.filter,
        },
        () => onChangeRef.current(),
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, JSON.stringify(subscriptions)]);
}
