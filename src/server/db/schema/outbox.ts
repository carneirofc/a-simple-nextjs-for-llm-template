import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import * as z from "zod";
import { JOB_STATUSES } from "@/lib/jobs";

/**
 * Message queue + transactional outbox. A row is either a domain event written in the same
 * transaction as the state change that produced it, or a job a user/client asked for directly.
 * The event processor claims rows with `FOR UPDATE SKIP LOCKED`, runs the handlers, retries with
 * backoff and parks rows as `failed` (dead letter) after `maxAttempts`.
 */
export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: text().notNull(),
    payload: jsonb().notNull(),
    status: text({ enum: JOB_STATUSES }).notNull().default("pending"),
    attempts: integer().notNull().default(0),
    maxAttempts: integer().notNull().default(5),
    runAt: timestamp().notNull().defaultNow(),
    lockedAt: timestamp(),
    lastError: text(),
    /** 0–100, reported by long-running handlers through `context.reportProgress`. */
    progress: integer(),
    /** JSON returned by the handler (e.g. a report summary), exposed by `GET /api/v1/jobs/:id`. */
    result: jsonb(),
    createdAt: timestamp().notNull().defaultNow(),
    completedAt: timestamp(),
  },
  (table) => [index().on(table.status, table.runAt)],
);

// `payload`/`result` are validated by event and result schemas where they are read.
export const outboxEventSelectSchema = createSelectSchema(outboxEvents, {
  payload: z.unknown(),
  result: z.unknown(),
});

export type OutboxEventRow = z.infer<typeof outboxEventSelectSchema>;
