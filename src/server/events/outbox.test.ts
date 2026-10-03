// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { MessageQueue, OutboxStore } from "./outbox-ports";
import { LOCK_TIMEOUT_MS } from "./outbox-ports";

// Contract test: the fake and the Drizzle adapters must behave the same.

type TestOutbox = MessageQueue & OutboxStore;

async function createPgliteOutbox(): Promise<TestOutbox> {
  const [{ PGlite }, { drizzle }, { migrate }, { schema }, adapters] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
    import("@/server/db/client"),
    import("./drizzle-outbox"),
  ]);
  const db = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { ...adapters.createDrizzleOutbox(db), ...adapters.createDrizzleOutboxStore(db) };
}

async function createFake(): Promise<TestOutbox> {
  const { createFakeOutbox } = await import("./fake-outbox");
  return createFakeOutbox();
}

const later = (ms: number) => new Date(Date.now() + ms);

describe.each([
  ["fake", createFake],
  ["drizzle (PGlite)", createPgliteOutbox],
])(
  "Outbox: %s",
  (_name, createOutbox) => {
    it("claims a due event once and counts the attempt", async () => {
      const outbox = await createOutbox();
      await outbox.enqueue({ type: "thing.happened", thingId: "1" });

      const [claimed] = await outbox.claim({ now: later(1000), limit: 10 });

      expect(claimed).toMatchObject({
        type: "thing.happened",
        payload: { type: "thing.happened", thingId: "1" },
        status: "running",
        attempts: 1,
      });
      expect(await outbox.claim({ now: later(1000), limit: 10 })).toEqual([]);
    });

    it("does not claim completed or dead-lettered events", async () => {
      const outbox = await createOutbox();
      await outbox.enqueue({ type: "a" });
      await outbox.enqueue({ type: "b" });
      const claimed = await outbox.claim({ now: later(1000), limit: 10 });

      await outbox.complete(claimed[0]?.id ?? "", { now: new Date() });
      await outbox.fail(claimed[1]?.id ?? "", "boom");

      expect(await outbox.claim({ now: later(LOCK_TIMEOUT_MS * 2), limit: 10 })).toEqual([]);
    });

    it("retries after the given time", async () => {
      const outbox = await createOutbox();
      await outbox.enqueue({ type: "a" });
      const [claimed] = await outbox.claim({ now: later(1000), limit: 10 });

      await outbox.retry(claimed?.id ?? "", { error: "boom", runAt: later(60_000) });

      expect(await outbox.claim({ now: later(30_000), limit: 10 })).toEqual([]);
      const [retried] = await outbox.claim({ now: later(61_000), limit: 10 });
      expect(retried).toMatchObject({ attempts: 2, lastError: "boom" });
    });

    it("reclaims events whose lock expired (crashed worker)", async () => {
      const outbox = await createOutbox();
      await outbox.enqueue({ type: "a" });
      await outbox.claim({ now: later(1000), limit: 10 });

      const reclaimed = await outbox.claim({ now: later(LOCK_TIMEOUT_MS + 5000), limit: 10 });

      expect(reclaimed).toEqual([expect.objectContaining({ attempts: 2 })]);
    });

    it("respects the batch limit", async () => {
      const outbox = await createOutbox();
      await outbox.enqueue({ type: "a" });
      await outbox.enqueue({ type: "b" });

      expect(await outbox.claim({ now: later(1000), limit: 1 })).toHaveLength(1);
    });

    it("returns the job id and exposes progress and result by id", async () => {
      const outbox = await createOutbox();
      const { id } = await outbox.enqueue({ type: "report.requested" });
      await outbox.claim({ now: later(1000), limit: 10 });

      await outbox.setProgress(id, 40);
      expect(await outbox.get(id)).toMatchObject({ status: "running", progress: 40 });

      await outbox.complete(id, { now: new Date(), result: { rows: 3 } });
      expect(await outbox.get(id)).toMatchObject({ status: "done", result: { rows: 3 } });
      expect(await outbox.get(crypto.randomUUID())).toBeUndefined();
    });

    it("honours delayed jobs and custom max attempts", async () => {
      const outbox = await createOutbox();
      const { id } = await outbox.enqueue({ type: "a" }, { runAt: later(60_000), maxAttempts: 1 });

      expect(await outbox.claim({ now: later(1000), limit: 10 })).toEqual([]);
      expect(await outbox.claim({ now: later(61_000), limit: 10 })).toEqual([
        expect.objectContaining({ id, maxAttempts: 1 }),
      ]);
    });
  },
  30_000,
);
