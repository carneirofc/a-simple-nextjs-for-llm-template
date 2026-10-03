/** Comment line clients ignore; keeps idle connections open through proxies and load balancers. */
export const SSE_HEARTBEAT = ": ping\n\n";

/** One Server-Sent Events message. `id` lets `EventSource` resend it as `Last-Event-ID`. */
export function formatSseMessage({ id, data }: { id?: string; data: unknown }): string {
  const lines = id ? [`id: ${id}`] : [];
  // JSON.stringify never emits raw newlines, so the payload always fits on one `data:` line.
  lines.push(`data: ${JSON.stringify(data)}`);
  return `${lines.join("\n")}\n\n`;
}

/** Tells `EventSource` how long to wait before reconnecting. */
export function formatSseRetry(milliseconds: number): string {
  return `retry: ${milliseconds}\n\n`;
}
