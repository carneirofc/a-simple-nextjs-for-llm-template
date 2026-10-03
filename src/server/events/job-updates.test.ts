import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBroker } from "./event-broker";
import { normalizeProgress, publishJobUpdate } from "./job-updates";

describe("job updates", () => {
  it("publishes a job.updated event with a fresh id", () => {
    const broker = createInMemoryEventBroker();
    const listener = vi.fn();
    broker.subscribe(listener);
    const occurredAt = new Date("2026-01-01T00:00:00.000Z");

    publishJobUpdate({ broker, clock: () => occurredAt }, "job-1", { status: "running" });

    expect(listener).toHaveBeenCalledWith({
      id: expect.any(String),
      occurredAt,
      event: { type: "job.updated", jobId: "job-1", status: "running", progress: null },
    });
  });

  it("clamps and rounds progress", () => {
    expect([-5, 12.4, 99.6, 150].map(normalizeProgress)).toEqual([0, 12, 100, 100]);
  });
});
