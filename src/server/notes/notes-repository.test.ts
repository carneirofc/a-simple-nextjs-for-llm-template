// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { NotesRepository } from "./notes-ports";

// Contract test: every adapter of the `NotesRepository` port must pass the same assertions.

async function createPgliteRepository(): Promise<NotesRepository> {
  const [{ PGlite }, { drizzle }, { migrate }, { schema }, { createDrizzleNotesRepository }] =
    await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
      import("@/server/db/client"),
      import("./drizzle-notes-repository"),
    ]);
  // In-memory database: no files, discarded after the test.
  const db = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return createDrizzleNotesRepository(db);
}

async function createFake(): Promise<NotesRepository> {
  const { createFakeNotesRepository } = await import("./fake-notes-repository");
  return createFakeNotesRepository();
}

describe.each([
  ["fake", createFake],
  ["drizzle (PGlite)", createPgliteRepository],
])(
  "NotesRepository: %s",
  (_name, createRepository) => {
    it("inserts a note and returns the stored row", async () => {
      const repo = await createRepository();

      const created = await repo.insert({ title: "Buy milk" });

      expect(created).toEqual({
        id: expect.any(String),
        title: "Buy milk",
        createdAt: expect.any(Date),
      });
    });

    it("lists notes newest first", async () => {
      const repo = await createRepository();
      const first = await repo.insert({ title: "first" });
      const second = await repo.insert({ title: "second" });

      expect((await repo.list()).map((note) => note.id)).toEqual([second.id, first.id]);
    });
  },
  30_000,
);
