import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type * as z from "zod";

export const NOTE_TITLE_MAX = 200;

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

// Types are always derived from these schemas — never hand-written.
export const noteSelectSchema = createSelectSchema(notes);
export const noteInsertSchema = createInsertSchema(notes, {
  title: (schema) => schema.trim().min(1, "Title is required").max(NOTE_TITLE_MAX),
}).pick({ title: true });

export type Note = z.infer<typeof noteSelectSchema>;
export type NewNote = z.infer<typeof noteInsertSchema>;
