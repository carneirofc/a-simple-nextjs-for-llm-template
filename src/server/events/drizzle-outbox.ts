import "server-only";
import { and, asc, eq, inArray, lt, lte, or, sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { outboxEvents } from "@/server/db/schema/outbox";
import { LOCK_TIMEOUT_MS, type Outbox, type OutboxStore } from "./outbox-ports";

export function createDrizzleOutbox(db: Database): Outbox {
  return {
    enqueue: async (event) => {
      await db.insert(outboxEvents).values({ type: event.type, payload: event });
    },
  };
}

function isDue(now: Date) {
  const staleBefore = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  return or(
    and(eq(outboxEvents.status, "pending"), lte(outboxEvents.runAt, now)),
    and(eq(outboxEvents.status, "running"), lt(outboxEvents.lockedAt, staleBefore)),
  );
}

function claimDue(db: Database, { now, limit }: { now: Date; limit: number }) {
  return db.transaction(async (tx) => {
    const due = await tx
      .select({ id: outboxEvents.id })
      .from(outboxEvents)
      .where(isDue(now))
      .orderBy(asc(outboxEvents.runAt))
      .limit(limit)
      // Concurrent workers (other instances) skip rows already locked instead of waiting.
      .for("update", { skipLocked: true });
    if (due.length === 0) {
      return [];
    }
    return (
      tx
        .update(outboxEvents)
        // Counted at claim time so a job that crashes the process still runs out of attempts.
        .set({ status: "running", lockedAt: now, attempts: sql`${outboxEvents.attempts} + 1` })
        .where(
          inArray(
            outboxEvents.id,
            due.map((row) => row.id),
          ),
        )
        .returning()
    );
  });
}

export function createDrizzleOutboxStore(db: Database): OutboxStore {
  return {
    claim: (options) => claimDue(db, options),
    complete: async (id, now) => {
      await db
        .update(outboxEvents)
        .set({ status: "done", completedAt: now, lockedAt: null, lastError: null })
        .where(eq(outboxEvents.id, id));
    },
    retry: async (id, { error, runAt }) => {
      await db
        .update(outboxEvents)
        .set({ status: "pending", runAt, lockedAt: null, lastError: error })
        .where(eq(outboxEvents.id, id));
    },
    fail: async (id, error) => {
      await db
        .update(outboxEvents)
        .set({ status: "failed", lockedAt: null, lastError: error })
        .where(eq(outboxEvents.id, id));
    },
  };
}
