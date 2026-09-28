"use server";

import type { NewNote, Note } from "@/server/db/schema/notes";
import { getNotes, insertNote } from "./data";

// Client-callable entry points. Never call these during render; Server Components use `data.ts`.

export async function listNotes(): Promise<Note[]> {
  return await getNotes();
}

export async function createNote(input: NewNote): Promise<Note> {
  return await insertNote(input);
}
