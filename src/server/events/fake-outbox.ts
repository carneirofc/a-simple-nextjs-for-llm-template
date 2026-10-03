import type { OutboxEventRow } from "@/server/db/schema/outbox";
import type { DomainEvent } from "./domain-event";
import {
  type EnqueueOptions,
  LOCK_TIMEOUT_MS,
  type MessageQueue,
  type OutboxStore,
} from "./outbox-ports";

function newRow(message: DomainEvent, options: EnqueueOptions, at: Date): OutboxEventRow {
  return {
    ...{ id: crypto.randomUUID(), type: message.type, payload: message, status: "pending" },
    ...{ attempts: 0, maxAttempts: options.maxAttempts ?? 5, runAt: options.runAt ?? at },
    ...{ lockedAt: null, lastError: null, createdAt: at, completedAt: null },
    ...{ progress: null, result: null },
  };
}

function isDue(row: OutboxEventRow, at: Date): boolean {
  const staleBefore = at.getTime() - LOCK_TIMEOUT_MS;
  return (
    (row.status === "pending" && row.runAt <= at) ||
    (row.status === "running" && (row.lockedAt?.getTime() ?? 0) < staleBefore)
  );
}

function selectDue(rows: Iterable<OutboxEventRow>, at: Date, limit: number): OutboxEventRow[] {
  return [...rows]
    .filter((row) => isDue(row, at))
    .sort((a, b) => a.runAt.getTime() - b.runAt.getTime())
    .slice(0, limit)
    .map((row) => ({ ...row, status: "running", lockedAt: at, attempts: row.attempts + 1 }));
}

/** In-memory queue for tests; same contract as the Drizzle adapters (see `outbox.test.ts`). */
export function createFakeOutbox(
  now: () => Date = () => new Date(),
): MessageQueue & OutboxStore & { readonly rows: () => OutboxEventRow[] } {
  const rows = new Map<string, OutboxEventRow>();
  const patch = (id: string, values: Partial<OutboxEventRow>) => {
    const row = rows.get(id);
    if (row) {
      rows.set(id, { ...row, ...values });
    }
    return Promise.resolve();
  };

  return {
    rows: () => [...rows.values()],
    enqueue: (message, options = {}) => {
      const row = newRow(message, options, now());
      rows.set(row.id, row);
      return Promise.resolve({ id: row.id });
    },
    get: (id) => Promise.resolve(rows.get(id)),
    setProgress: (id, progress) => patch(id, { progress }),
    claim: ({ now: at, limit }) => {
      const due = selectDue(rows.values(), at, limit);
      for (const row of due) {
        rows.set(row.id, row);
      }
      return Promise.resolve(due);
    },
    complete: (id, { now: at, result = null }) =>
      patch(id, { status: "done", completedAt: at, result, lockedAt: null, lastError: null }),
    retry: (id, { error, runAt }) =>
      patch(id, { status: "pending", runAt, lockedAt: null, lastError: error }),
    fail: (id, error) => patch(id, { status: "failed", lockedAt: null, lastError: error }),
  };
}
