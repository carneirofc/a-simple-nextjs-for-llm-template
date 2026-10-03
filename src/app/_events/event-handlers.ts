import "server-only";
import { createNotesEventHandlers } from "@/features/notes/notes-event-handlers";
import type { Container } from "@/server/container";
import { mergeEventHandlers } from "@/server/events/domain-event";
import { createEventProcessor } from "@/server/events/event-processor";

// Composition of feature event handlers (app level, because `src/server` may not import features).

export function createAppEventProcessor(container: Container) {
  return createEventProcessor({
    store: container.outboxStore,
    broker: container.eventBroker,
    clock: container.clock,
    handlers: mergeEventHandlers(createNotesEventHandlers(container)),
  });
}
