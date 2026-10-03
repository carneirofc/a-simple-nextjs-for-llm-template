import "server-only";

/** Writes one message; `data` is sent as JSON (never contains raw newlines, so one `data:` line). */
export type SseSend = (data: unknown) => void;

type EventStreamOptions = {
  /** Closes the stream when the client disconnects (`request.signal`). */
  readonly signal: AbortSignal;
  /** Starts forwarding messages through `send`; returns the unsubscribe function. */
  readonly subscribe: (send: SseSend) => () => void;
  readonly heartbeatMs?: number;
};

// `retry:` sets the browser's reconnect delay; `:` lines are comments that keep idle connections
// open through proxies and load balancers.
const RETRY_FRAME = "retry: 3000\n\n";
const HEARTBEAT_FRAME = ": ping\n\n";

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
}: EventStreamOptions): Response {
  const encoder = new TextEncoder();
  let stop: () => void = () => undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // The client may already be gone (it left while the route awaited setup): an aborted signal
      // never fires `abort` again, so subscribing now would leak the listener and timer.
      if (signal.aborted) {
        controller.close();
        return;
      }
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      const unsubscribe = subscribe((data) => write(`data: ${JSON.stringify(data)}\n\n`));
      const heartbeat = setInterval(() => write(HEARTBEAT_FRAME), heartbeatMs);
      const onAbort = () => {
        stop();
        controller.close();
      };
      // Runs once, whichever comes first: client abort or stream cancel.
      stop = () => {
        stop = () => undefined;
        clearInterval(heartbeat);
        unsubscribe();
        signal.removeEventListener("abort", onAbort);
      };
      signal.addEventListener("abort", onAbort, { once: true });
      write(RETRY_FRAME);
    },
    cancel: () => stop(),
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
