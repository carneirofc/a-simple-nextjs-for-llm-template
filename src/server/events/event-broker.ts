import * as z from "zod";

/**
 * Generic shape of every event. Features define concrete events as Zod discriminated unions on
 * `type` (`<entity>.<verb-ed>`, thin: IDs, not entities) in `<feature>-events.ts`.
 */
export const domainEventSchema = z.looseObject({ type: z.string().min(1) });

export type DomainEvent = z.infer<typeof domainEventSchema>;

/** What subscribers (SSE connections) receive: the event plus an id and a timestamp. */
export const publishedEventSchema = z.object({
  id: z.uuid(),
  occurredAt: z.date(),
  event: domainEventSchema,
});

export type PublishedEvent = z.infer<typeof publishedEventSchema>;

/**
 * Port: live, best-effort fan-out of events to subscribers. Not durable and not a job queue: an
 * event published while nobody listens is gone, and clients resync on reconnect. Work that must
 * survive crashes belongs in an external queue (see docs/architecture/events.md).
 */
export type EventBroker = {
  readonly publish: (event: DomainEvent) => void;
  /** Returns the unsubscribe function. */
  readonly subscribe: (listener: (message: PublishedEvent) => void) => () => void;
};

/**
 * Single-process adapter. With several server instances, swap in a Redis pub/sub (or Postgres
 * `LISTEN/NOTIFY`) adapter in `src/server/container.ts`; nothing else changes.
 */
export function createInMemoryEventBroker(clock: () => Date = () => new Date()): EventBroker {
  const listeners = new Set<(message: PublishedEvent) => void>();
  return {
    publish: (event) => {
      const message = { id: crypto.randomUUID(), occurredAt: clock(), event };
      for (const listener of listeners) {
        try {
          listener(message);
        } catch (error) {
          // One broken subscriber must not starve the others.
          console.error("Event listener failed", error);
        }
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// One broker per process, shared by every module graph (actions, route handlers) and surviving
// dev hot reloads.
const globalForBroker = globalThis as typeof globalThis & { eventBroker?: EventBroker | undefined };

export function getProcessEventBroker(): EventBroker {
  globalForBroker.eventBroker ??= createInMemoryEventBroker();
  return globalForBroker.eventBroker;
}
