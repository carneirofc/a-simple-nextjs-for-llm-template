import * as z from "zod";

/**
 * Generic shape of every event. Features define concrete events as Zod discriminated unions on
 * `type` (`<entity>.<verb-ed>`, thin: IDs, not entities) in `<feature>-events.ts`.
 */
export const domainEventSchema = z.looseObject({ type: z.string().min(1) });

export type DomainEvent = z.infer<typeof domainEventSchema>;

type EventListener = (event: DomainEvent) => void;

/**
 * Port: live, best-effort fan-out of events to subscribers (SSE connections). Not durable and not
 * a job queue: an event published while nobody listens is gone, and clients resync on reconnect.
 * Work that must survive crashes belongs in an external queue (see docs/architecture/events.md).
 */
export type EventBroker = {
  readonly publish: (event: DomainEvent) => void;
  /** Returns the unsubscribe function. */
  readonly subscribe: (listener: EventListener) => () => void;
};

/**
 * Single-process adapter. With several server instances, swap in a Redis pub/sub (or Postgres
 * `LISTEN/NOTIFY`) adapter in `src/server/container.ts`; nothing else changes.
 */
export function createInMemoryEventBroker(): EventBroker {
  const listeners = new Set<EventListener>();
  return {
    publish: (event) => {
      for (const listener of listeners) {
        try {
          listener(event);
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
