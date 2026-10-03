import * as z from "zod";
import { jobSchema } from "@/lib/jobs";
import { getContainer } from "@/server/container";
import { problem } from "@/server/http/json-response";

// Status of any queued job (user-triggered or event). Job ids are unguessable UUIDs and the payload
// is never returned; jobs that carry per-user results must also check the caller here.

export async function GET(_request: Request, { params }: RouteContext<"/api/v1/jobs/[id]">) {
  const id = z.uuid().safeParse((await params).id);
  const row = id.success ? await (await getContainer()).outboxStore.get(id.data) : undefined;
  if (!row) {
    return problem({ code: "notFound" });
  }
  const job = jobSchema.parse({
    id: row.id,
    type: row.type,
    status: row.status,
    progress: row.progress,
    attempts: row.attempts,
    result: row.result,
    error: row.lastError,
  });
  return Response.json(job, { headers: { "cache-control": "no-store" } });
}
