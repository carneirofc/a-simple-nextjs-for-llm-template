import { describe, expect, it, vi } from "vitest";
import type { EventHandler } from "./domain-event";
import { createInMemoryEventBroker } from "./event-broker";
import { createEventProcessor } from "./event-processor";
import { createFakeOutbox } from "./fake-outbox";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const clock = () => NOW;

function setup(handler: EventHandler) {
  const outbox = createFakeOutbox(() => new Date(NOW.getTime() - 1000));
  const broker = createInMemoryEventBroker();
  const published = vi.fn();
  broker.subscribe(published);
  const processor = createEventProcessor({
    store: outbox,
    broker,
    clock,
    handlers: { "thing.happened": [handler] },
  });
  return { outbox, processor, published };
}

describe("createEventProcessor", () => {
  it("runs handlers, completes the event and publishes it", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const { outbox, processor, published } = setup(handler);
    await outbox.enqueue({ type: "thing.happened", thingId: "1" });

    expect(await processor.runOnce()).toEqual({ done: 1, retried: 0, failed: 0 });
    expect(handler).toHaveBeenCalledWith({ type: "thing.happened", thingId: "1" });
    expect(outbox.rows()[0]).toMatchObject({ status: "done", completedAt: NOW });
    expect(published).toHaveBeenCalledWith(
      expect.objectContaining({ event: { type: "thing.happened", thingId: "1" } }),
    );
  });

  it("completes events nobody handles (they are still published)", async () => {
    const { outbox, processor, published } = setup(vi.fn());
    await outbox.enqueue({ type: "other.happened" });

    expect(await processor.runOnce()).toEqual({ done: 1, retried: 0, failed: 0 });
    expect(published).toHaveBeenCalledOnce();
  });

  it("schedules a retry with backoff when a handler throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { outbox, processor, published } = setup(vi.fn().mockRejectedValue(new Error("down")));
    await outbox.enqueue({ type: "thing.happened" });

    expect(await processor.runOnce()).toEqual({ done: 0, retried: 1, failed: 0 });
    expect(outbox.rows()[0]).toMatchObject({
      status: "pending",
      lastError: "down",
      runAt: new Date(NOW.getTime() + 2000),
    });
    expect(published).not.toHaveBeenCalled();
  });

  it("dead-letters the event after its last attempt", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { outbox, processor } = setup(vi.fn().mockRejectedValue(new Error("down")));
    await outbox.enqueue({ type: "thing.happened" });

    for (let attempt = 1; attempt < 5; attempt += 1) {
      await processor.runOnce();
      const row = outbox.rows()[0];
      if (row) {
        await outbox.retry(row.id, { error: "down", runAt: NOW });
      }
    }

    expect(await processor.runOnce()).toEqual({ done: 0, retried: 0, failed: 1 });
    expect(outbox.rows()[0]).toMatchObject({ status: "failed", attempts: 5 });
  });
});
