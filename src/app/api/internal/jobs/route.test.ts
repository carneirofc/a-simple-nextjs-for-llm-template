// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "s".repeat(32);
const runOnce = vi.fn().mockResolvedValue({ done: 2, retried: 0, failed: 0 });

vi.mock("@/server/container", () => ({ getContainer: () => Promise.resolve({}) }));
vi.mock("@/app/_events/event-handlers", () => ({
  createAppEventProcessor: () => ({ runOnce }),
}));

async function post(headers: Record<string, string> = {}) {
  vi.resetModules();
  const { POST } = await import("./route");
  return POST(new Request("http://localhost/api/internal/jobs", { method: "POST", headers }));
}

describe("POST /api/internal/jobs", () => {
  beforeEach(() => {
    vi.stubEnv("JOBS_SECRET", SECRET);
  });

  it("drains one batch for the scheduler", async () => {
    const response = await post({ authorization: `Bearer ${SECRET}` });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ done: 2, retried: 0, failed: 0 });
  });

  it("rejects a wrong token", async () => {
    expect((await post({ authorization: "Bearer nope" })).status).toBe(403);
    expect(runOnce).not.toHaveBeenCalled();
  });

  it("does not exist without a configured secret", async () => {
    vi.stubEnv("JOBS_SECRET", "");

    expect((await post({ authorization: `Bearer ${SECRET}` })).status).toBe(404);
  });
});
