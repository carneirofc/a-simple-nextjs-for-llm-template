import * as z from "zod";
import { defineRealtimeEvents } from "@/lib/realtime";
import { notesCache } from "./notes-cache";

// Notes events, published by `data.ts` and pushed to browsers over SSE. Thin by design (IDs only):
// clients refetch through the normal API instead of trusting pushed data.

export const noteCreatedEventSchema = z.object({
  type: z.literal("note.created"),
  noteId: z.uuid(),
});

export const noteEventSchema = z.discriminatedUnion("type", [noteCreatedEventSchema]);

export type NoteEvent = z.infer<typeof noteEventSchema>;

/** Browser side: which cached queries a notes event makes stale. */
export const notesRealtimeEvents = defineRealtimeEvents(noteEventSchema, () => [
  notesCache.key.all,
]);
