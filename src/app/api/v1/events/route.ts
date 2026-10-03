import { matchRealtimeEvent } from "@/app/_events/realtime-events";
import { isEnabled } from "@/lib/flags";
import { getContainer } from "@/server/container";
import { eventStreamResponse } from "@/server/http/event-stream";
import { problem } from "@/server/http/json-response";

// Server-Sent Events: processed outbox events that browsers may see (filtered by the realtime
// event schemas). Payloads are thin (IDs); clients refetch through the normal, authorized API.
// Per-user data would need the caller resolved here and events filtered per user/tenant.

export async function GET(request: Request): Promise<Response> {
  if (!isEnabled("realtime")) {
    return problem({ code: "notFound" });
  }
  const { eventBroker } = await getContainer();
  return eventStreamResponse({
    signal: request.signal,
    subscribe: (send) =>
      eventBroker.subscribe(({ id, event }) => {
        if (matchRealtimeEvent(event) !== null) {
          send({ id, data: event });
        }
      }),
  });
}
