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
        processedAt: null,
      });
    });

    it("lists notes newest first", async () => {
      const repo = await createRepository();
      const first = await repo.insert({ title: "first" });
      const second = await repo.insert({ title: "second" });

      expect((await repo.list()).map((note) => note.id)).toEqual([second.id, first.id]);
    });

    it("marks a note processed exactly once", async () => {
      const repo = await createRepository();
      const note = await repo.insert({ title: "work" });
      const at = new Date("2026-01-01T00:00:00.000Z");

      expect(await repo.markProcessed(note.id, at)).toBe(true);
      expect(await repo.markProcessed(note.id, new Date())).toBe(false);
      expect((await repo.list())[0]?.processedAt).toEqual(at);
    });

    it("ignores unknown notes", async () => {
      const repo = await createRepository();

      expect(await repo.markProcessed(crypto.randomUUID(), new Date())).toBe(false);
    });
  },
  30_000,
);
