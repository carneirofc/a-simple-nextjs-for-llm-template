import type { QueryKey } from "@tanstack/react-query";
import type * as z from "zod";

/** Matches an incoming realtime payload and returns the query keys to invalidate, or `null`. */
export type RealtimeEvents = (data: unknown) => readonly QueryKey[] | null;

/**
 * Pairs a feature's public event schema with the queries those events make stale. Anything that
 * does not parse is ignored, so unknown or internal events never reach the cache.
 */
export function defineRealtimeEvents<T>(
  schema: z.ZodType<T>,
  queryKeysFor: (event: T) => readonly QueryKey[],
): RealtimeEvents {
  return (data) => {
    const parsed = schema.safeParse(data);
    return parsed.success ? queryKeysFor(parsed.data) : null;
  };
}

/** Combines feature matchers; returns `null` when no feature recognizes the payload. */
export function combineRealtimeEvents(matchers: readonly RealtimeEvents[]): RealtimeEvents {
  return (data) => {
    const matched = matchers.map((match) => match(data)).filter((keys) => keys !== null);
    return matched.length > 0 ? matched.flat() : null;
  };
}
