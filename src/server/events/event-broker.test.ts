import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBroker } from "./event-broker";

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("createInMemoryEventBroker", () => {
  it("wraps events with an id and timestamp and delivers them until unsubscribed", () => {
    const broker = createInMemoryEventBroker(() => NOW);
    const listener = vi.fn();
    const unsubscribe = broker.subscribe(listener);

    broker.publish({ type: "a.happened" });
    unsubscribe();
    broker.publish({ type: "a.happened" });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      id: expect.any(String),
      occurredAt: NOW,
      event: { type: "a.happened" },
    });
  });

  it("keeps delivering when one listener throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broker = createInMemoryEventBroker();
    const healthy = vi.fn();
    broker.subscribe(() => {
      throw new Error("broken");
    });
    broker.subscribe(healthy);

    broker.publish({ type: "a.happened" });

    expect(healthy).toHaveBeenCalledOnce();
  });
});
