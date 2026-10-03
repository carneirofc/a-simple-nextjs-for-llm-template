import "server-only";
import type { Container } from "@/server/container";
import type { EventHandlers } from "@/server/events/domain-event";
import { noteCreatedEventSchema } from "./notes-events";

export type NotesEventHandlerDeps = Pick<Container, "transaction" | "clock">;

/**
 * Async processing for notes, run by the event processor (at-least-once, so idempotent).
 * Replace the body with real work: call a backend, generate a summary, send a notification.
 */
export function createNotesEventHandlers({
  transaction,
  clock,
}: NotesEventHandlerDeps): EventHandlers {
  return {
    "note.created": [
      async (event) => {
        const { noteId } = noteCreatedEventSchema.parse(event);
        await transaction(async ({ notesRepo, outbox }) => {
          // Only the first successful run emits the follow-up event; retries are no-ops.
          if (await notesRepo.markProcessed(noteId, clock())) {
            await outbox.enqueue({ type: "note.processed", noteId });
          }
        });
      },
    ],
  };
}
