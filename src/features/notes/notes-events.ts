import * as z from "zod";
import { defineRealtimeEvents } from "@/lib/realtime";
import { notesCache } from "./notes-cache";

// Notes events: the payloads stored in the outbox, handled by `notes-event-handlers.ts`, and
// pushed to browsers over SSE. Thin by design (IDs only): consumers re-read through the API.

export const noteCreatedEventSchema = z.object({
  type: z.literal("note.created"),
  noteId: z.uuid(),
});

export const noteProcessedEventSchema = z.object({
  type: z.literal("note.processed"),
  noteId: z.uuid(),
});

export const noteEventSchema = z.discriminatedUnion("type", [
  noteCreatedEventSchema,
  noteProcessedEventSchema,
]);

export type NoteEvent = z.infer<typeof noteEventSchema>;

/** Browser side: which cached queries a notes event makes stale. */
export const notesRealtimeEvents = defineRealtimeEvents(noteEventSchema, () => [
  notesCache.key.all,
]);
