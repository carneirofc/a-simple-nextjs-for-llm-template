import type { OutboxEventRow } from "@/server/db/schema/outbox";
import type { DomainEvent } from "./domain-event";

/** A `running` row whose lock is older than this is assumed orphaned (crashed worker). */
export const LOCK_TIMEOUT_MS = 5 * 60_000;

/** Write side, used inside a unit of work so the event commits with the state change. */
export type Outbox = {
  readonly enqueue: (event: DomainEvent) => Promise<void>;
};

/** Processing side, used by the event processor. */
export type OutboxStore = {
  /** Locks up to `limit` due rows (pending, or running with an expired lock) and bumps `attempts`. */
  readonly claim: (options: { now: Date; limit: number }) => Promise<OutboxEventRow[]>;
  readonly complete: (id: string, now: Date) => Promise<void>;
  readonly retry: (id: string, failure: { error: string; runAt: Date }) => Promise<void>;
  /** Dead letter: stays in the table as `failed` for inspection and manual replay. */
  readonly fail: (id: string, error: string) => Promise<void>;
};
