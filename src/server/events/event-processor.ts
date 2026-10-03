import type { OutboxEventRow } from "@/server/db/schema/outbox";
import { domainEventSchema, type EventHandlers } from "./domain-event";
import type { EventBroker } from "./event-broker";
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

async function processRow(deps: EventProcessorDeps, row: OutboxEventRow): Promise<Outcome> {
  try {
    // The payload comes back from a jsonb column: parse it like any other boundary.
    const event = domainEventSchema.parse(row.payload);
    for (const handler of deps.handlers[event.type] ?? []) {
      await handler(event);
    }
    await deps.store.complete(row.id, deps.clock());
    deps.broker.publish({ id: row.id, occurredAt: row.createdAt, event });
    return "done";
  } catch (error) {
    console.error(`Event ${row.type} (${row.id}) failed on attempt ${row.attempts}`, error);
    if (row.attempts >= row.maxAttempts) {
      await deps.store.fail(row.id, errorMessage(error));
      return "failed";
    }
    const runAt = nextAttemptAt(row.attempts, deps.clock());
    await deps.store.retry(row.id, { error: errorMessage(error), runAt });
    return "retried";
  }
}

/** Claims due outbox rows, runs their handlers, then publishes them to live subscribers. */
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
