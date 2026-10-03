import type { JobStatus, JobUpdatedEvent } from "@/lib/jobs";
import { toPublishedEvent } from "./domain-event";
import type { EventBroker } from "./event-broker";

type JobUpdateDeps = { readonly broker: EventBroker; readonly clock: () => Date };

/** Pushes an ephemeral `job.updated` event so browsers tracking the job refetch its status. */
export function publishJobUpdate(
  { broker, clock }: JobUpdateDeps,
  jobId: string,
  update: { status: JobStatus; progress?: number | null },
): void {
  const event: JobUpdatedEvent = {
    type: "job.updated",
    jobId,
    status: update.status,
    progress: update.progress ?? null,
  };
  broker.publish(toPublishedEvent(event, { occurredAt: clock() }));
}

/** Clamps and rounds handler-reported progress to an integer percentage. */
export function normalizeProgress(progress: number): number {
  return Math.min(100, Math.max(0, Math.round(progress)));
}
