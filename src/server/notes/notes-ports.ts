import type { NewNote, Note } from "@/server/db/schema/notes";

/** Port: the persistence behaviour the notes use cases need. Adapters: Drizzle (app), fake (tests). */
export type NotesRepository = {
  /** Newest first. */
  readonly list: () => Promise<Note[]>;
  readonly insert: (values: NewNote) => Promise<Note>;
  /** Idempotent: returns `false` when the note was already processed (or does not exist). */
  readonly markProcessed: (id: string, at: Date) => Promise<boolean>;
};
