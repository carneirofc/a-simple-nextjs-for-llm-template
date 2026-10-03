import "server-only";
import type { Container } from "@/server/container";
import type { EventHandlers } from "@/server/events/domain-event";
import { noteCreatedEventSchema } from "./notes-events";
import { type NotesReport, notesReportRequestedSchema } from "./notes-jobs";

export type NotesEventHandlerDeps = Pick<
  Container,
  "transaction" | "clock" | "notesRepo" | "sleep"
>;

const REPORT_STEPS = 4;
const REPORT_STEP_MS = 400;

/**
 * Async work for notes, run by the event processor (at-least-once, so idempotent).
 * Replace the bodies with real work: call a backend, generate a file, send a notification.
 */
export function createNotesEventHandlers(deps: NotesEventHandlerDeps): EventHandlers {
  return {
    // Reaction to a write (transactional outbox).
    "note.created": [
      async (event) => {
        const { noteId } = noteCreatedEventSchema.parse(event);
        await deps.transaction(async ({ notesRepo, outbox }) => {
          // Only the first successful run emits the follow-up event; retries are no-ops.
          if (await notesRepo.markProcessed(noteId, deps.clock())) {
            await outbox.enqueue({ type: "note.processed", noteId });
          }
        });
      },
    ],
    // User-triggered job with progress and a result (read-only, so naturally idempotent).
    "notes.report-requested": [
      async (event, { reportProgress }): Promise<NotesReport> => {
        notesReportRequestedSchema.parse(event);
        const notes = await deps.notesRepo.list();
        // Simulated long-running work, so the UI can show progress.
        for (let step = 1; step <= REPORT_STEPS; step += 1) {
          await deps.sleep(REPORT_STEP_MS);
          await reportProgress((step / REPORT_STEPS) * 100);
        }
        const processedCount = notes.filter((note) => note.processedAt !== null).length;
        return { noteCount: notes.length, processedCount };
      },
    ],
  };
}
