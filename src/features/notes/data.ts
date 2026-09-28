import "server-only";
import { desc } from "drizzle-orm";
import { isEnabled } from "@/lib/flags";
import { getDb } from "@/server/db/client";
import { type NewNote, type Note, noteInsertSchema, notes } from "@/server/db/schema/notes";

// Server-only data access. Call directly from Server Components; expose to the client via `actions.ts`.

function assertEnabled(): void {
  if (!isEnabled("notesExample")) {
    throw new Error("Feature disabled: notesExample");
  }
}

export async function getNotes(): Promise<Note[]> {
  assertEnabled();
  const db = await getDb();
  return db.select().from(notes).orderBy(desc(notes.createdAt));
}

export async function insertNote(input: NewNote): Promise<Note> {
  assertEnabled();
  const values = noteInsertSchema.parse(input);
  const db = await getDb();
  const [created] = await db.insert(notes).values(values).returning();
  if (!created) {
    throw new Error("Insert returned no row");
  }
  return created;
}
