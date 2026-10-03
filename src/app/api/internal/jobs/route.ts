import { createAppEventProcessor } from "@/app/_events/event-handlers";
import { env } from "@/env";
import { getContainer } from "@/server/container";
import { bearerTokenMatches } from "@/server/http/bearer-token";
import { problem } from "@/server/http/json-response";

// Drains one batch of due outbox events. For `JOBS_RUNNER=external` deployments (serverless,
// cron): call it on a schedule with `Authorization: Bearer $JOBS_SECRET`. 404 when no secret is set.

export async function POST(request: Request): Promise<Response> {
  if (!env.JOBS_SECRET) {
    return problem({ code: "notFound" });
  }
  if (!bearerTokenMatches(request.headers.get("authorization"), env.JOBS_SECRET)) {
    return problem({ code: "forbidden" });
  }
  const summary = await createAppEventProcessor(await getContainer()).runOnce();
  return Response.json(summary, { headers: { "cache-control": "no-store" } });
}
