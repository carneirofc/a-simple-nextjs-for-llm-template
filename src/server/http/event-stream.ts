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

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  // Reverse proxies (nginx) must not buffer the stream.
  "x-accel-buffering": "no",
};

/** `text/event-stream` response that forwards subscribed messages until the client goes away. */
export function eventStreamResponse({
  signal,
  subscribe,
  heartbeatMs = 25_000,
}: EventStreamOptions) {
  const encoder = new TextEncoder();
  let stop: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // The client may already be gone (e.g. it left while the route awaited setup): an aborted
      // signal never fires `abort` again, so subscribing now would leak the listener and timer.
      if (signal.aborted) {
        controller.close();
        return;
      }
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      const unsubscribe = subscribe((message) => write(formatSseMessage(message)));
      const heartbeat = setInterval(() => write(SSE_HEARTBEAT), heartbeatMs);
      // Idempotent: runs once, whichever comes first (client abort or stream cancel).
      stop = () => {
        stop = undefined;
        clearInterval(heartbeat);
        unsubscribe();
        signal.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        stop?.();
        controller.close();
      };
      signal.addEventListener("abort", onAbort, { once: true });
      write(formatSseRetry(RETRY_MS));
    },
    cancel() {
      stop?.();
    },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
