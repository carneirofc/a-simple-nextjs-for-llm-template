import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEventSource } from "./use-event-source";

class FakeEventSource {
  static last: FakeEventSource | undefined;
  readonly url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  close = vi.fn();
  constructor(url: string) {
    this.url = url;
    FakeEventSource.last = this;
  }
}

function connect() {
  vi.stubGlobal("EventSource", FakeEventSource);
  const onMessage = vi.fn();
  const onReconnect = vi.fn();
  const hook = renderHook(() => useEventSource("/events", { onMessage, onReconnect }));
  const source = FakeEventSource.last as FakeEventSource;
  return { hook, source, onMessage, onReconnect };
}

describe("useEventSource", () => {
  it("connects and passes parsed JSON messages", () => {
    const { source, onMessage } = connect();

    source.onmessage?.({ data: '{"type":"a"}' });
    source.onmessage?.({ data: "not json" });

    expect(source.url).toBe("/events");
    expect(onMessage).toHaveBeenNthCalledWith(1, { type: "a" });
    expect(onMessage).toHaveBeenNthCalledWith(2, undefined);
  });

  it("reports reconnects, not the first connection", () => {
    const { source, onReconnect } = connect();

    source.onopen?.();
    expect(onReconnect).not.toHaveBeenCalled();
    source.onopen?.();
    expect(onReconnect).toHaveBeenCalledOnce();
  });

  it("closes the connection on unmount", () => {
    const { hook, source } = connect();

    hook.unmount();

    expect(source.close).toHaveBeenCalledOnce();
  });
});
