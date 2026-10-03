import * as z from "zod";
import type { ValidationKey } from "@/i18n/dictionaries/en";

export const NOTE_TITLE_MAX = 200;

/**
 * User input rules, shared by the client form and the server use case. Plain Zod (no Drizzle), so
 * importing it from a client component does not ship database code to the browser.
 * Messages are `ValidationKey`s; the UI translates them (see `FieldErrors`).
 */
export const noteInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "required" satisfies ValidationKey)
    .max(NOTE_TITLE_MAX, "tooLong" satisfies ValidationKey),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
