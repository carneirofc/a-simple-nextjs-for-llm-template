import { type NoteResponse, notesListResponseSchema } from "./notes-api-schemas";

export const NOTES_API_PATH = "/api/v1/notes";

/** Browser read path: `GET` route handler (cacheable, parallel), not a queued server action. */
export async function fetchNotes(): Promise<NoteResponse[]> {
  const response = await fetch(NOTES_API_PATH, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`GET ${NOTES_API_PATH} failed with ${response.status}`);
  }
  return notesListResponseSchema.parse(await response.json()).items;
}
