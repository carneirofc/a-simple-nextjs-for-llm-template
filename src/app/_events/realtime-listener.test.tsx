import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RealtimeListener } from "./realtime-listener";

class FakeEventSource {
  static last: FakeEventSource | undefined;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  close = vi.fn();
  constructor() {
    FakeEventSource.last = this;
  }
}

function mount() {
  vi.stubGlobal("EventSource", FakeEventSource);
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={queryClient}>
      <RealtimeListener />
    </QueryClientProvider>,
  );
  return { invalidate, source: FakeEventSource.last as FakeEventSource };
}

describe("RealtimeListener", () => {
  it("invalidates the queries a known event affects", () => {
    const { invalidate, source } = mount();
    const noteId = crypto.randomUUID();

    source.onmessage?.({ data: JSON.stringify({ type: "note.created", noteId }) });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notes"] });
  });

  it("ignores unknown events", () => {
    const { invalidate, source } = mount();

    source.onmessage?.({ data: JSON.stringify({ type: "internal.audit" }) });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("resyncs everything after a reconnect", () => {
    const { invalidate, source } = mount();

    source.onopen?.();
    source.onopen?.();

    expect(invalidate).toHaveBeenCalledWith();
  });
});
