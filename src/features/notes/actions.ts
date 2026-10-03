"use server";

import type { ActionResult } from "@/lib/action-result";
import type { Note } from "@/server/db/schema/notes";
import { getNotesService } from "./data";

// Client-callable mutations only (actions are queued one at a time; reads use `/api/v1/notes`).
// Never call these during render; Server Components use `data.ts`.

export async function createNote(input: unknown): Promise<ActionResult<Note>> {
  return (await getNotesService()).create(input);
}
