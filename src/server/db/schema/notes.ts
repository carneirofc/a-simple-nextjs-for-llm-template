import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type * as z from "zod";
import type { ValidationKey } from "@/i18n/dictionaries/en";

export const NOTE_TITLE_MAX = 200;

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

// Types are always derived from these schemas — never hand-written.
export const noteSelectSchema = createSelectSchema(notes);
export const noteInsertSchema = createInsertSchema(notes, {
  // Messages are `ValidationKey`s; the UI translates them (see `FieldErrors`).
  title: (schema) =>
    schema
      .trim()
      .min(1, "required" satisfies ValidationKey)
      .max(NOTE_TITLE_MAX, "tooLong" satisfies ValidationKey),
}).pick({ title: true });

export type Note = z.infer<typeof noteSelectSchema>;
export type NewNote = z.infer<typeof noteInsertSchema>;
