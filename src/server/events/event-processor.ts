import type { OutboxEventRow } from "@/server/db/schema/outbox";
import { type DomainEvent, domainEventSchema, type EventHandlers } from "./domain-event";
import type { EventBroker } from "./event-broker";
import { normalizeProgress, publishJobUpdate } from "./job-updates";
import type { OutboxStore } from "./outbox-ports";
import { nextAttemptAt } from "./retry-policy";

const BATCH_SIZE = 10;

export type EventProcessorDeps = {
  readonly store: OutboxStore;
  readonly broker: EventBroker;
  readonly handlers: EventHandlers;
  readonly clock: () => Date;
};

export type ProcessSummary = { done: number; retried: number; failed: number };

type Outcome = keyof ProcessSummary;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs every handler for the event; the last non-`undefined` return value is the job result. */
async function runHandlers(deps: EventProcessorDeps, row: OutboxEventRow, event: DomainEvent) {
  const context = {
    jobId: row.id,
    attempt: row.attempts,
    reportProgress: async (progress: number) => {
      const value = normalizeProgress(progress);
      await deps.store.setProgress(row.id, value);
      publishJobUpdate(deps, row.id, { status: "running", progress: value });
    },
  };
  let result: unknown;
  for (const handler of deps.handlers[event.type] ?? []) {
    const value = await handler(event, context);
    result = value === undefined ? result : value;
  }
  return result;
}

async function handleFailure(deps: EventProcessorDeps, row: OutboxEventRow, error: unknown) {
  console.error(`Event ${row.type} (${row.id}) failed on attempt ${row.attempts}`, error);
  if (row.attempts >= row.maxAttempts) {
    await deps.store.fail(row.id, errorMessage(error));
    publishJobUpdate(deps, row.id, { status: "failed" });
    return "failed";
  }
  const runAt = nextAttemptAt(row.attempts, deps.clock());
  await deps.store.retry(row.id, { error: errorMessage(error), runAt });
  publishJobUpdate(deps, row.id, { status: "pending" });
  return "retried";
}

async function processRow(deps: EventProcessorDeps, row: OutboxEventRow): Promise<Outcome> {
  publishJobUpdate(deps, row.id, { status: "running", progress: row.progress });
  try {
    // The payload comes back from a jsonb column: parse it like any other boundary.
    const event = domainEventSchema.parse(row.payload);
    const result = await runHandlers(deps, row, event);
    await deps.store.complete(row.id, { now: deps.clock(), result });
    deps.broker.publish({ id: row.id, occurredAt: row.createdAt, event });
    publishJobUpdate(deps, row.id, { status: "done" });
    return "done";
  } catch (error) {
    return handleFailure(deps, row, error);
  }
}

/** Claims due queue rows, runs their handlers, then publishes them to live subscribers. */
export function createEventProcessor(deps: EventProcessorDeps) {
  return {
    runOnce: async (): Promise<ProcessSummary> => {
      const summary: ProcessSummary = { done: 0, retried: 0, failed: 0 };
      const rows = await deps.store.claim({ now: deps.clock(), limit: BATCH_SIZE });
      // Sequential on purpose: predictable load; scale out with more instances, not more promises.
      for (const row of rows) {
        summary[await processRow(deps, row)] += 1;
      }
      return summary;
    },
  };
}

export type EventProcessor = ReturnType<typeof createEventProcessor>;
