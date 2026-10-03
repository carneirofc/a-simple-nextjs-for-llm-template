import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RealtimeListener } from "./realtime-listener";

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

function mount() {
  vi.stubGlobal("EventSource", FakeEventSource);
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RealtimeListener />
    </QueryClientProvider>,
  );
  return { invalidate, view, source: FakeEventSource.last as FakeEventSource };
}

describe("RealtimeListener", () => {
  it("invalidates the queries a known event affects", () => {
    const { invalidate, source } = mount();
    const noteId = crypto.randomUUID();

    source.onmessage?.({ data: JSON.stringify({ type: "note.created", noteId }) });

    expect(source.url).toBe("/api/v1/events");
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ["notes"] });
  });

  it("ignores unknown events and malformed frames", () => {
    const { invalidate, source } = mount();

    source.onmessage?.({ data: JSON.stringify({ type: "internal.audit" }) });
    source.onmessage?.({ data: "not json" });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("resyncs everything after a reconnect, not on the first connection", () => {
    const { invalidate, source } = mount();

    source.onopen?.();
    expect(invalidate).not.toHaveBeenCalled();
    source.onopen?.();

    expect(invalidate).toHaveBeenCalledExactlyOnceWith();
  });

  it("closes the connection on unmount", () => {
    const { view, source } = mount();

    view.unmount();

    expect(source.close).toHaveBeenCalledOnce();
  });
});
