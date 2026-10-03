import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBroker } from "./event-broker";

describe("createInMemoryEventBroker", () => {
  it("delivers events until unsubscribed", () => {
    const broker = createInMemoryEventBroker();
    const listener = vi.fn();
    const unsubscribe = broker.subscribe(listener);

    broker.publish({ type: "a.happened" });
    unsubscribe();
    broker.publish({ type: "a.happened" });

    expect(listener).toHaveBeenCalledExactlyOnceWith({ type: "a.happened" });
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
