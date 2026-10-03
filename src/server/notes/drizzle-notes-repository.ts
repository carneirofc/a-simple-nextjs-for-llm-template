import "server-only";
import { desc } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { notes } from "@/server/db/schema/notes";
import type { NotesRepository } from "./notes-ports";

export function createDrizzleNotesRepository(db: Database): NotesRepository {
  return {
    list: () => db.select().from(notes).orderBy(desc(notes.createdAt)),
    insert: async (values) => {
      const [created] = await db.insert(notes).values(values).returning();
      if (!created) {
        throw new Error("Insert returned no row");
      }
      return created;
    },
  };
}
