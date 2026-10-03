import "server-only";
import { env } from "@/env";
import { getContainer } from "@/server/container";
import { startPolling } from "@/server/events/poller";
import { createAppEventProcessor } from "./event-handlers";

const globalForRunner = globalThis as typeof globalThis & { stopJobsRunner?: () => void };

/**
 * Starts the in-process outbox poller (`JOBS_RUNNER=inline`, the default). Every instance may run
 * one: `FOR UPDATE SKIP LOCKED` keeps them from processing the same event twice concurrently.
 * With `JOBS_RUNNER=external`, a scheduler calls `POST /api/internal/jobs` instead.
 */
export function startInlineJobsRunner(): void {
  if (env.JOBS_RUNNER !== "inline" || globalForRunner.stopJobsRunner) {
    return;
  }
  globalForRunner.stopJobsRunner = startPolling({
    run: async () => createAppEventProcessor(await getContainer()).runOnce(),
    intervalMs: env.JOBS_POLL_INTERVAL_MS,
    onError: (error) => console.error("Outbox poll failed", error),
  });
}
