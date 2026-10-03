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

    send({ type: "a", text: "x\ny" });
    expect(await readChunk(reader)).toBe('data: {"type":"a","text":"x\\ny"}\n\n');

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

  it("does not subscribe when the client is already gone", async () => {
    const controller = new AbortController();
    controller.abort();
    const subscribe = vi.fn();

    const response = eventStreamResponse({ signal: controller.signal, subscribe });

    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    expect(await reader.read()).toEqual({ done: true, value: undefined });
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("unsubscribes once when the stream is cancelled before the abort", async () => {
    const controller = new AbortController();
    const unsubscribe = vi.fn();
    const response = eventStreamResponse({
      signal: controller.signal,
      subscribe: () => unsubscribe,
    });

    await (response.body as ReadableStream<Uint8Array>).cancel();
    controller.abort();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
