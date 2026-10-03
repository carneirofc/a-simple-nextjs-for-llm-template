import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBroker } from "./event-broker";

const EVENT = { id: crypto.randomUUID(), occurredAt: new Date(), event: { type: "a" } };

describe("createInMemoryEventBroker", () => {
  it("delivers to subscribers until they unsubscribe", () => {
    const broker = createInMemoryEventBroker();
    const listener = vi.fn();
    const unsubscribe = broker.subscribe(listener);

    broker.publish(EVENT);
    unsubscribe();
    broker.publish(EVENT);

    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps delivering when one listener throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broker = createInMemoryEventBroker();
    const healthy = vi.fn();
    broker.subscribe(() => {
      throw new Error("broken");
    });
    broker.subscribe(healthy);

    broker.publish(EVENT);

    expect(healthy).toHaveBeenCalledWith(EVENT);
  });
});
