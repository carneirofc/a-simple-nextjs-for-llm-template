// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { notesListResponseSchema } from "@/features/notes/notes-api-schemas";
import { createFakeNotesRepository } from "@/server/notes/fake-notes-repository";
import { GET } from "./route";

const NOTE = {
  id: "4f6c1c56-7f0a-4bd4-9c39-2f5b3b0c1e11",
  title: "Buy milk",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

// The composition root is the seam: swap the adapter, keep the real route + use case.
vi.mock("@/server/container", () => ({
  getContainer: () => Promise.resolve({ notesRepo: createFakeNotesRepository([NOTE]) }),
}));

const URL = "http://localhost/api/v1/notes";

describe("GET /api/v1/notes", () => {
  it("returns the public contract with ISO dates and an ETag", async () => {
    const response = await GET(new Request(URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBeTruthy();
    const body: unknown = await response.json();
    expect(body).toEqual({ items: [{ ...NOTE, createdAt: "2026-01-02T03:04:05.000Z" }] });
    expect(notesListResponseSchema.parse(body).items[0]?.createdAt).toEqual(NOTE.createdAt);
  });

  it("answers a matching If-None-Match with 304", async () => {
    const etag = (await GET(new Request(URL))).headers.get("etag") ?? "";

    const response = await GET(new Request(URL, { headers: { "if-none-match": etag } }));

    expect(response.status).toBe(304);
  });
});
