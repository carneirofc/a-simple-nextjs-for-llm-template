"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEventSource } from "@/lib/use-event-source";
import { matchRealtimeEvent, REALTIME_EVENTS_PATH } from "./realtime-events";

const logError = (error: unknown) => console.error("Realtime invalidation failed", error);

/**
 * Keeps TanStack Query in sync with server-side events: each known event invalidates the queries
 * it affects (data is refetched through the normal API, never pushed). After a reconnect every
 * query is invalidated, because events sent while disconnected were missed.
 */
export function RealtimeListener() {
  const queryClient = useQueryClient();

  useEventSource(REALTIME_EVENTS_PATH, {
    onMessage: (data) => {
      for (const queryKey of matchRealtimeEvent(data) ?? []) {
        queryClient.invalidateQueries({ queryKey }).catch(logError);
      }
    },
    onReconnect: () => {
      queryClient.invalidateQueries().catch(logError);
    },
  });

  return null;
}
