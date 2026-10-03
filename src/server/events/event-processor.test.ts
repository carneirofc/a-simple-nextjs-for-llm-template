import { describe, expect, it, vi } from "vitest";
import type { EventHandler, PublishedEvent } from "./domain-event";
import { createInMemoryEventBroker } from "./event-broker";
import { createEventProcessor } from "./event-processor";
import { createFakeOutbox } from "./fake-outbox";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const clock = () => NOW;

function setup(handler: EventHandler) {
  const outbox = createFakeOutbox(() => new Date(NOW.getTime() - 1000));
  const broker = createInMemoryEventBroker();
  const published: PublishedEvent["event"][] = [];
  broker.subscribe(({ event }) => published.push(event));
  const processor = createEventProcessor({
    store: outbox,
    broker,
    clock,
    handlers: { "thing.happened": [handler] },
  });
  return { outbox, processor, published };
}

const jobUpdates = (events: PublishedEvent["event"][]) =>
  events.filter((event) => event.type === "job.updated");

describe("createEventProcessor", () => {
  it("runs handlers, completes the job and publishes the event", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const { outbox, processor, published } = setup(handler);
    const { id } = await outbox.enqueue({ type: "thing.happened", thingId: "1" });

    expect(await processor.runOnce()).toEqual({ done: 1, retried: 0, failed: 0 });
    expect(handler).toHaveBeenCalledWith(
      { type: "thing.happened", thingId: "1" },
      expect.objectContaining({ jobId: id, attempt: 1 }),
    );
    expect(await outbox.get(id)).toMatchObject({ status: "done", completedAt: NOW });
    expect(published).toContainEqual({ type: "thing.happened", thingId: "1" });
  });

  it("stores the handler result and reported progress, and pushes job.updated events", async () => {
    const { outbox, processor, published } = setup(async (_event, { reportProgress }) => {
      await reportProgress(49.6);
      return { rows: 3 };
    });
    const { id } = await outbox.enqueue({ type: "thing.happened" });

    await processor.runOnce();

    expect(await outbox.get(id)).toMatchObject({ progress: 50, result: { rows: 3 } });
    expect(jobUpdates(published)).toEqual([
      { type: "job.updated", jobId: id, status: "running", progress: null },
      { type: "job.updated", jobId: id, status: "running", progress: 50 },
      { type: "job.updated", jobId: id, status: "done", progress: null },
    ]);
  });

  it("completes messages nobody handles (they are still published)", async () => {
    const { outbox, processor, published } = setup(vi.fn());
    await outbox.enqueue({ type: "other.happened" });

    expect(await processor.runOnce()).toEqual({ done: 1, retried: 0, failed: 0 });
    expect(published).toContainEqual({ type: "other.happened" });
  });

  it("schedules a retry with backoff when a handler throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { outbox, processor, published } = setup(vi.fn().mockRejectedValue(new Error("down")));
    const { id } = await outbox.enqueue({ type: "thing.happened" });

    expect(await processor.runOnce()).toEqual({ done: 0, retried: 1, failed: 0 });
    expect(await outbox.get(id)).toMatchObject({
      status: "pending",
      lastError: "down",
      runAt: new Date(NOW.getTime() + 2000),
    });
    expect(published).not.toContainEqual({ type: "thing.happened" });
    expect(jobUpdates(published).at(-1)).toMatchObject({ status: "pending" });
  });

  it("dead-letters the job after its last attempt", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { outbox, processor, published } = setup(vi.fn().mockRejectedValue(new Error("down")));
    const { id } = await outbox.enqueue({ type: "thing.happened" }, { maxAttempts: 1 });

    expect(await processor.runOnce()).toEqual({ done: 0, retried: 0, failed: 1 });
    expect(await outbox.get(id)).toMatchObject({ status: "failed", attempts: 1 });
    expect(jobUpdates(published).at(-1)).toMatchObject({ status: "failed" });
  });
});
