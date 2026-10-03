import type { Note } from "@/server/db/schema/notes";
import type { NotesRepository } from "./notes-ports";

/** In-memory adapter for tests. Same contract as the Drizzle one (see `notes-repository.test.ts`). */
export function createFakeNotesRepository(seed: readonly Note[] = []): NotesRepository {
  let rows: Note[] = [...seed];
  return {
    list: () => Promise.resolve([...rows]),
    insert: (values) => {
      const created: Note = { id: crypto.randomUUID(), createdAt: new Date(), ...values };
      rows = [created, ...rows];
      return Promise.resolve(created);
    },
  };
}
