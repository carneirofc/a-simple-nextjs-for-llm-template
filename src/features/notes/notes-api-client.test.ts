import { describe, expect, it, vi } from "vitest";
import { fetchNotes, NOTES_API_PATH } from "./notes-api-client";

describe("fetchNotes", () => {
  it("decodes the wire format into notes with Date values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        items: [
          {
            id: "4f6c1c56-7f0a-4bd4-9c39-2f5b3b0c1e11",
            title: "Buy milk",
            createdAt: "2026-01-02T03:04:05.000Z",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const notes = await fetchNotes();

    expect(fetchMock).toHaveBeenCalledWith(NOTES_API_PATH, expect.anything());
    expect(notes[0]?.createdAt).toEqual(new Date("2026-01-02T03:04:05.000Z"));
  });

  it("throws on a non-2xx response so TanStack Query reports an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(fetchNotes()).rejects.toThrow("503");
  });

  it("rejects a response that breaks the contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ items: [{ id: 1 }] })));

    await expect(fetchNotes()).rejects.toThrow();
  });
});
