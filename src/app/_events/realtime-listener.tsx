"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { matchRealtimeEvent, REALTIME_EVENTS_PATH } from "./realtime-events";

const logError = (error: unknown) => console.error("Realtime invalidation failed", error);

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined; // Malformed frames are ignored rather than breaking the stream.
  }
}

/**
 * Keeps TanStack Query in sync with server-side events over the browser's native `EventSource`
 * (automatic reconnect, same-origin cookies): each known event invalidates the queries it affects
 * (data is refetched through the normal API, never pushed). After a reconnect every query is
 * invalidated, because events sent while disconnected were missed.
 */
export function RealtimeListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(REALTIME_EVENTS_PATH);
    let connectedBefore = false;
    source.onopen = () => {
      if (connectedBefore) {
        queryClient.invalidateQueries().catch(logError);
      }
      connectedBefore = true;
    };
    source.onmessage = (message: MessageEvent<string>) => {
      for (const queryKey of matchRealtimeEvent(parseJson(message.data)) ?? []) {
        queryClient.invalidateQueries({ queryKey }).catch(logError);
      }
    };
    return () => source.close();
  }, [queryClient]);

  return null;
}
