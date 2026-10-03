// @vitest-environment node
import { describe, expect, it } from "vitest";
import { notes } from "./db/schema/notes";
import { outboxEvents } from "./db/schema/outbox";

async function setup() {
  const [{ PGlite }, { drizzle }, { migrate }, { schema }, { createDrizzleUnitOfWork }] =
    await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
      import("./db/client"),
      import("./unit-of-work"),
    ]);
  const db = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { db, transaction: createDrizzleUnitOfWork(db) };
}

// PGlite boots WASM and migrates per test: allow for slow, loaded CI runners.
describe("createDrizzleUnitOfWork", { timeout: 30_000 }, () => {
  it("commits the state change and the outbox event together", async () => {
    const { db, transaction } = await setup();

    await transaction(async ({ notesRepo, outbox }) => {
      const note = await notesRepo.insert({ title: "atomic" });
      await outbox.enqueue({ type: "note.created", noteId: note.id });
    });

    expect(await db.select().from(notes)).toHaveLength(1);
    expect(await db.select().from(outboxEvents)).toEqual([
      expect.objectContaining({ type: "note.created", status: "pending" }),
    ]);
  });

  it("rolls both back when the work throws", async () => {
    const { db, transaction } = await setup();

    await expect(
      transaction(async ({ notesRepo, outbox }) => {
        await notesRepo.insert({ title: "lost" });
        await outbox.enqueue({ type: "note.created" });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(await db.select().from(notes)).toEqual([]);
    expect(await db.select().from(outboxEvents)).toEqual([]);
  });
});
