// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createFakeOutbox } from "@/server/events/fake-outbox";
import { GET } from "./route";

const queue = createFakeOutbox();

vi.mock("@/server/container", () => ({
  getContainer: () => Promise.resolve({ outboxStore: queue }),
}));

const get = (id: string) =>
  GET(new Request(`http://localhost/api/v1/jobs/${id}`), { params: Promise.resolve({ id }) });

describe("GET /api/v1/jobs/:id", () => {
  it("returns the job status without the payload", async () => {
    const { id } = await queue.enqueue({ type: "report.requested", secret: "payload" });

    const response = await get(id);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      id,
      type: "report.requested",
      status: "pending",
      progress: null,
      attempts: 0,
      result: null,
      error: null,
    });
  });

  it("answers 404 for unknown or malformed ids", async () => {
    expect((await get(crypto.randomUUID())).status).toBe(404);
    expect((await get("not-a-uuid")).status).toBe(404);
  });
});
