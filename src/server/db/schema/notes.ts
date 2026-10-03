import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type * as z from "zod";

export const notes = pgTable("notes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

// DB shapes, always derived from the table. User-facing validation rules live in the feature
// (`src/features/notes/notes-schema.ts`); `tsc` checks that its output fits `NewNote`.
export const noteSelectSchema = createSelectSchema(notes);
export const noteInsertSchema = createInsertSchema(notes).pick({ title: true });

export type Note = z.infer<typeof noteSelectSchema>;
export type NewNote = z.infer<typeof noteInsertSchema>;
