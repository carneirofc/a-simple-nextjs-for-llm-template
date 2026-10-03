import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import type { Job } from "@/lib/jobs";
import { notesReportStatusText } from "./notes-report-status";

const job = (overrides: Partial<Job>): Job => ({
  id: crypto.randomUUID(),
  type: "notes.report-requested",
  status: "pending",
  progress: null,
  attempts: 0,
  result: null,
  error: null,
  ...overrides,
});

const text = (overrides: Partial<Job>) => notesReportStatusText(job(overrides), en.notes.report);

describe("notesReportStatusText", () => {
  it("describes each state", () => {
    expect(text({})).toBe("Report queued…");
    expect(text({ status: "running", progress: 50 })).toBe("Generating report… 50%");
    expect(text({ status: "done", result: { noteCount: 3, processedCount: 2 } })).toBe(
      "Report: 3 notes, 2 processed.",
    );
    expect(text({ status: "failed" })).toBe("The report could not be generated.");
  });

  it("treats an unexpected result as a failure", () => {
    expect(text({ status: "done", result: { nope: true } })).toBe(
      "The report could not be generated.",
    );
  });
});
