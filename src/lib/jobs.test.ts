import { describe, expect, it } from "vitest";
import { isJobFinished, jobSchema, jobsRealtimeEvents } from "./jobs";

describe("jobs contract", () => {
  it("treats done and failed as finished", () => {
    expect(["pending", "running", "done", "failed"].map((s) => isJobFinished(s as never))).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it("parses the status DTO", () => {
    const job = {
      id: crypto.randomUUID(),
      type: "x.requested",
      status: "running",
      progress: 40,
      attempts: 1,
      result: null,
      error: null,
    };
    expect(jobSchema.parse(job)).toEqual(job);
    expect(jobSchema.safeParse({ ...job, progress: 140 }).success).toBe(false);
  });

  it("maps job.updated events to the job's query key", () => {
    const jobId = crypto.randomUUID();
    expect(
      jobsRealtimeEvents({ type: "job.updated", jobId, status: "done", progress: null }),
    ).toEqual([["jobs", jobId]]);
    expect(jobsRealtimeEvents({ type: "note.created" })).toBeNull();
  });
});
