"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { ActionResult } from "@/lib/action-result";
import { isJobFinished } from "@/lib/jobs";
import { useJob } from "@/lib/use-job";
import { notesReportStatusText } from "./notes-report-status";

type NotesReportProps = {
  labels: Dictionary["notes"]["report"];
  /** Enqueues the job (server action); resolves to its id. */
  onRequest: () => Promise<ActionResult<{ jobId: string }>>;
};

/** Button that enqueues a background job and shows its live status, progress and result. */
export function NotesReport({ labels, onRequest }: NotesReportProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const { data: job } = useJob(jobId);
  const request = useMutation({
    mutationFn: onRequest,
    onSuccess: (result) => setJobId(result.ok ? result.data.jobId : null),
  });
  const busy = request.isPending || (jobId !== null && !(job && isJobFinished(job.status)));

  return (
    <div className="flex items-center gap-3">
      <Button disabled={busy} onClick={() => request.mutate()} type="button">
        {labels.request}
      </Button>
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {job ? notesReportStatusText(job, labels) : null}
      </p>
    </div>
  );
}
