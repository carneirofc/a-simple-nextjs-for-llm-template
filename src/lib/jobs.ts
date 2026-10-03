import * as z from "zod";
import { defineRealtimeEvents } from "./realtime";

// Client-safe contract for background jobs: every queued message (user-triggered job or domain
// event) is a job with an id, a status and, optionally, progress and a result.

export const JOB_STATUSES = ["pending", "running", "done", "failed"] as const;

export const jobStatusSchema = z.enum(JOB_STATUSES);

export type JobStatus = z.infer<typeof jobStatusSchema>;

/** Wire format of `GET /api/v1/jobs/:id`. The payload is never exposed; `result` is job-specific. */
export const jobSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  status: jobStatusSchema,
  /** 0–100 when the handler reports progress, otherwise `null`. */
  progress: z.number().int().min(0).max(100).nullable(),
  attempts: z.number().int(),
  result: z.unknown(),
  error: z.string().nullable(),
});

export type Job = z.infer<typeof jobSchema>;

/** Ephemeral lifecycle event pushed over SSE whenever a job changes status or progress. */
export const jobUpdatedEventSchema = z.object({
  type: z.literal("job.updated"),
  jobId: z.uuid(),
  status: jobStatusSchema,
  progress: z.number().int().min(0).max(100).nullable(),
});

export type JobUpdatedEvent = z.infer<typeof jobUpdatedEventSchema>;

export const JOBS_API_PATH = "/api/v1/jobs";

export const jobsCache = {
  key: {
    all: ["jobs"] as const,
    detail: (id: string) => ["jobs", id] as const,
  },
};

export function isJobFinished(status: JobStatus): boolean {
  return status === "done" || status === "failed";
}

/** Browser side: a `job.updated` event refreshes that job's status query. */
export const jobsRealtimeEvents = defineRealtimeEvents(jobUpdatedEventSchema, (event) => [
  jobsCache.key.detail(event.jobId),
]);
