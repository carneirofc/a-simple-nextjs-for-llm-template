import type { OutboxEventRow } from "@/server/db/schema/outbox";
import type { DomainEvent } from "./domain-event";

/** A `running` row whose lock is older than this is assumed orphaned (crashed worker). */
export const LOCK_TIMEOUT_MS = 5 * 60_000;

export type EnqueueOptions = {
  /** Earliest time to run (delayed / scheduled jobs). Default: now. */
  readonly runAt?: Date;
  /** Attempts before the job is dead-lettered. Default: 5. */
  readonly maxAttempts?: number;
};

/**
 * Port: put a message (domain event or job request) on the queue; resolves to the job id clients
 * can track. Two ways to get one: `transaction(({ outbox }) => …)` when it must commit with a state
 * change, or the container's `queue` when a user/client asks for work directly.
 */
export type MessageQueue = {
  readonly enqueue: (message: DomainEvent, options?: EnqueueOptions) => Promise<{ id: string }>;
};

/** Processing side, used by the event processor and the job status endpoint. */
export type OutboxStore = {
  /** Locks up to `limit` due rows (pending, or running with an expired lock) and bumps `attempts`. */
  readonly claim: (options: { now: Date; limit: number }) => Promise<OutboxEventRow[]>;
  readonly get: (id: string) => Promise<OutboxEventRow | undefined>;
  readonly setProgress: (id: string, progress: number) => Promise<void>;
  readonly complete: (id: string, outcome: { now: Date; result?: unknown }) => Promise<void>;
  readonly retry: (id: string, failure: { error: string; runAt: Date }) => Promise<void>;
  /** Dead letter: stays in the table as `failed` for inspection and manual replay. */
  readonly fail: (id: string, error: string) => Promise<void>;
};
