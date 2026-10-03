import * as z from "zod";

// User-triggered jobs (commands) for notes: not caused by a write, requested directly from the UI
// or an API client. Client-safe: the UI parses the result with the same schema the handler returns.

export const notesReportRequestedSchema = z.object({
  type: z.literal("notes.report-requested"),
});

export const notesReportSchema = z.object({
  noteCount: z.number().int(),
  processedCount: z.number().int(),
});

export type NotesReport = z.infer<typeof notesReportSchema>;
