import type { Dictionary } from "@/i18n/dictionaries/en";
import { interpolate } from "@/i18n/interpolate";
import type { Job } from "@/lib/jobs";
import { notesReportSchema } from "./notes-jobs";

/** Human-readable line for the report job's current state. */
export function notesReportStatusText(job: Job, labels: Dictionary["notes"]["report"]): string {
  if (job.status === "failed") {
    return labels.failed;
  }
  if (job.status === "done") {
    const report = notesReportSchema.safeParse(job.result);
    return report.success
      ? interpolate(labels.done, {
          count: report.data.noteCount,
          processed: report.data.processedCount,
        })
      : labels.failed;
  }
  if (job.status === "running" && job.progress !== null) {
    return interpolate(labels.running, { progress: job.progress });
  }
  return labels.queued;
}
