import * as z from "zod";

// Public wire contract of `/api/v1/notes`. Written explicitly (not derived from the DB table) so a
// schema change cannot silently change what API clients receive.

/** ISO-8601 string on the wire, `Date` in code: `z.encode` on the server, `parse` on the client. */
const isoDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (value) => new Date(value),
  encode: (date) => date.toISOString(),
});

export const noteResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  createdAt: isoDate,
  /** `null` while the async `note.created` processing has not finished. */
  processedAt: isoDate.nullable(),
});

export const notesListResponseSchema = z.object({
  items: z.array(noteResponseSchema),
});

export type NoteResponse = z.infer<typeof noteResponseSchema>;
