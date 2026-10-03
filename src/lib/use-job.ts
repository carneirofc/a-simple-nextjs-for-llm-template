import { useQuery } from "@tanstack/react-query";
import { isJobFinished, JOBS_API_PATH, type Job, jobSchema, jobsCache } from "./jobs";

/** Fallback polling while a job runs, in case the realtime stream is off or disconnected. */
const POLL_MS = 5000;

export async function fetchJob(id: string): Promise<Job> {
  const response = await fetch(`${JOBS_API_PATH}/${id}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`GET ${JOBS_API_PATH}/${id} failed with ${response.status}`);
  }
  return jobSchema.parse(await response.json());
}

/**
 * Tracks a background job. `job.updated` SSE events invalidate `jobsCache.key.detail(id)` (see
 * `RealtimeListener`), so status and progress update live; polling only covers missed events.
 */
export function useJob(id: string | null) {
  return useQuery({
    queryKey: jobsCache.key.detail(id ?? ""),
    queryFn: () => fetchJob(id ?? ""),
    enabled: id !== null,
    refetchInterval: (query) =>
      query.state.data && isJobFinished(query.state.data.status) ? false : POLL_MS,
  });
}
