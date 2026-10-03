import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fetchJob, useJob } from "./use-job";

const JOB = {
  id: "4f6c1c56-7f0a-4bd4-9c39-2f5b3b0c1e11",
  type: "x.requested",
  status: "done",
  progress: 100,
  attempts: 1,
  result: { rows: 3 },
  error: null,
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useJob", () => {
  it("does nothing until there is a job id", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useJob(null), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads and validates the job status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(JOB));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useJob(JOB.id), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(JOB));
    expect(fetchMock).toHaveBeenCalledWith(`/api/v1/jobs/${JOB.id}`, expect.anything());
  });

  it("throws on HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(fetchJob(JOB.id)).rejects.toThrow("404");
  });
});
