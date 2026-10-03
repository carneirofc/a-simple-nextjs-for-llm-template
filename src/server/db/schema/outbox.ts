import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import * as z from "zod";

export const OUTBOX_STATUSES = ["pending", "running", "done", "failed"] as const;

/**
 * Transactional outbox + processing queue. A row is written in the same transaction as the state
 * change that produced the event; the event processor claims rows with `FOR UPDATE SKIP LOCKED`,
 * runs the handlers, retries with backoff and parks rows as `failed` (dead letter) after
 * `maxAttempts`.
 */
export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: text().notNull(),
    payload: jsonb().notNull(),
    status: text({ enum: OUTBOX_STATUSES }).notNull().default("pending"),
    attempts: integer().notNull().default(0),
    maxAttempts: integer().notNull().default(5),
    runAt: timestamp().notNull().defaultNow(),
    lockedAt: timestamp(),
    lastError: text(),
    createdAt: timestamp().notNull().defaultNow(),
    completedAt: timestamp(),
  },
  (table) => [index().on(table.status, table.runAt)],
);

// `payload` is validated by the event schemas when it is read, so keep it `unknown` here.
export const outboxEventSelectSchema = createSelectSchema(outboxEvents, { payload: z.unknown() });

export type OutboxEventRow = z.infer<typeof outboxEventSelectSchema>;
