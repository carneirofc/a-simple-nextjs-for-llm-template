import "server-only";
import { formatSseMessage, formatSseRetry, SSE_HEARTBEAT } from "@/lib/sse";

export type SseSend = (message: { id?: string; data: unknown }) => void;

type EventStreamOptions = {
  /** Closes the stream when the client disconnects (`request.signal`). */
  readonly signal: AbortSignal;
  /** Starts forwarding messages through `send`; returns the unsubscribe function. */
  readonly subscribe: (send: SseSend) => () => void;
  readonly heartbeatMs?: number;
};

const RETRY_MS = 3000;

/** `text/event-stream` response that forwards subscribed messages until the client goes away. */
export function eventStreamResponse({
  signal,
  subscribe,
  heartbeatMs = 25_000,
}: EventStreamOptions) {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      write(formatSseRetry(RETRY_MS));
      const unsubscribe = subscribe((message) => write(formatSseMessage(message)));
      const heartbeat = setInterval(() => write(SSE_HEARTBEAT), heartbeatMs);
      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      signal.addEventListener(
        "abort",
        () => {
          cleanup?.();
          controller.close();
        },
        { once: true },
      );
    },
    cancel() {
      cleanup?.();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      // Reverse proxies (nginx) must not buffer the stream.
      "x-accel-buffering": "no",
    },
  });
}
