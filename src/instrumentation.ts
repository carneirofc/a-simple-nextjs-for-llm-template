import { PHASE_PRODUCTION_BUILD } from "next/constants";

/** Called once per server instance before it serves requests (Next.js instrumentation hook). */
export async function register(): Promise<void> {
  // Node.js server only: never in the Edge runtime, and never while `next build` prerenders.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return;
  }
  const { startInlineJobsRunner } = await import("./app/_events/jobs-runner");
  startInlineJobsRunner();
}
