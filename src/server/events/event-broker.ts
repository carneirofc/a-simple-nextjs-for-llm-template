import type { PublishedEvent } from "./domain-event";

/**
 * Port: live fan-out of processed events to subscribers (SSE connections). Best effort, not
 * durable: the outbox is the source of truth, clients resync on reconnect.
 */
export type EventBroker = {
  readonly publish: (event: PublishedEvent) => void;
  /** Returns the unsubscribe function. */
  readonly subscribe: (listener: (event: PublishedEvent) => void) => () => void;
};

/**
 * Single-process adapter. With several server instances the instance that processed an event is
 * not the one holding a given SSE connection: swap in a Postgres `LISTEN/NOTIFY` or Redis pub/sub
 * adapter in `src/server/container.ts` (see docs/architecture/events.md).
 */
export function createInMemoryEventBroker(): EventBroker {
  const listeners = new Set<(event: PublishedEvent) => void>();
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

// One broker per process, shared by every module graph (instrumentation, route handlers) and
// surviving dev hot reloads.
const globalForBroker = globalThis as typeof globalThis & { eventBroker?: EventBroker | undefined };

export function getProcessEventBroker(): EventBroker {
  globalForBroker.eventBroker ??= createInMemoryEventBroker();
  return globalForBroker.eventBroker;
}
