import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { NotesReport } from "./notes-report";

const JOB_ID = "4f6c1c56-7f0a-4bd4-9c39-2f5b3b0c1e11";

function renderReport(
  onRequest = vi.fn().mockResolvedValue({ ok: true, data: { jobId: JOB_ID } }),
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NotesReport labels={en.notes.report} onRequest={onRequest} />
    </QueryClientProvider>,
  );
  return onRequest;
}

const jobResponse = (status: string, extra: object = {}) =>
  Response.json({
    id: JOB_ID,
    type: "notes.report-requested",
    status,
    progress: null,
    attempts: 1,
    result: null,
    error: null,
    ...extra,
  });

describe("NotesReport", () => {
  it("enqueues the job and shows its result", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jobResponse("done", { result: { noteCount: 2, processedCount: 1 } })),
    );
    const onRequest = renderReport();

    await userEvent.click(screen.getByRole("button", { name: "Generate report" }));

    expect(onRequest).toHaveBeenCalledOnce();
    expect(await screen.findByText("Report: 2 notes, 1 processed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate report" })).toBeEnabled();
  });

  it("disables the button while the job is running", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jobResponse("running", { progress: 25 })));
    renderReport();

    await userEvent.click(screen.getByRole("button", { name: "Generate report" }));

    expect(await screen.findByText("Generating report… 25%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate report" })).toBeDisabled();
  });
});
