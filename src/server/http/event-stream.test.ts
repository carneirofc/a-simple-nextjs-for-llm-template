// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { eventStreamResponse, type SseSend } from "./event-stream";

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const { value } = await reader.read();
  return new TextDecoder().decode(value);
}

describe("eventStreamResponse", () => {
  it("streams subscribed messages as SSE and unsubscribes on abort", async () => {
    const controller = new AbortController();
    const unsubscribe = vi.fn();
    let send: SseSend = () => undefined;
    const response = eventStreamResponse({
      signal: controller.signal,
      subscribe: (forward) => {
        send = forward;
        return unsubscribe;
      },
    });

    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    expect(await readChunk(reader)).toBe("retry: 3000\n\n");

    send({ id: "1", data: { type: "a" } });
    expect(await readChunk(reader)).toBe('id: 1\ndata: {"type":"a"}\n\n');

    controller.abort();
    expect(await reader.read()).toEqual({ done: true, value: undefined });
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("sends heartbeats while idle", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const response = eventStreamResponse({
      signal: controller.signal,
      subscribe: () => () => undefined,
      heartbeatMs: 1000,
    });
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    await readChunk(reader);

    vi.advanceTimersByTime(1000);

    expect(await readChunk(reader)).toBe(": ping\n\n");
    controller.abort();
    vi.useRealTimers();
  });
});
