import type { OutboxEventRow } from "@/server/db/schema/outbox";
import { LOCK_TIMEOUT_MS, type Outbox, type OutboxStore } from "./outbox-ports";

/** In-memory outbox for tests; same contract as the Drizzle adapters (see `outbox.test.ts`). */
export function createFakeOutbox(
  now: () => Date = () => new Date(),
): Outbox & OutboxStore & { readonly rows: () => OutboxEventRow[] } {
  const rows = new Map<string, OutboxEventRow>();
  const patch = (id: string, values: Partial<OutboxEventRow>) => {
    const row = rows.get(id);
    if (row) {
      rows.set(id, { ...row, ...values });
    }
    return Promise.resolve();
  };
  const isDue = (row: OutboxEventRow, at: Date) =>
    (row.status === "pending" && row.runAt <= at) ||
    (row.status === "running" && (row.lockedAt?.getTime() ?? 0) < at.getTime() - LOCK_TIMEOUT_MS);

  return {
    rows: () => [...rows.values()],
    enqueue: (event) => {
      const at = now();
      const id = crypto.randomUUID();
      rows.set(id, {
        ...{ id, type: event.type, payload: event, status: "pending", attempts: 0, maxAttempts: 5 },
        ...{ runAt: at, lockedAt: null, lastError: null, createdAt: at, completedAt: null },
      });
      return Promise.resolve();
    },
    claim: ({ now: at, limit }) => {
      const due = [...rows.values()]
        .filter((row) => isDue(row, at))
        .sort((a, b) => a.runAt.getTime() - b.runAt.getTime())
        .slice(0, limit)
        .map((row) => ({
          ...row,
          status: "running" as const,
          lockedAt: at,
          attempts: row.attempts + 1,
        }));
      for (const row of due) {
        rows.set(row.id, row);
      }
      return Promise.resolve(due);
    },
    complete: (id, at) =>
      patch(id, { status: "done", completedAt: at, lockedAt: null, lastError: null }),
    retry: (id, { error, runAt }) =>
      patch(id, { status: "pending", runAt, lockedAt: null, lastError: error }),
    fail: (id, error) => patch(id, { status: "failed", lockedAt: null, lastError: error }),
  };
}
