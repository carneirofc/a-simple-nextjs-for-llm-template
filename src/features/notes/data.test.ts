// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createFakeNotesRepository } from "@/server/notes/fake-notes-repository";
import { createNotesService } from "./data";

// Use cases are tested through injected fakes: no database, no module mocks.

describe("notes service", () => {
  it("creates a note from valid input", async () => {
    const service = createNotesService({ notesRepo: createFakeNotesRepository() });

    const result = await service.create({ title: "  Buy milk " });

    expect(result).toEqual({ ok: true, data: expect.objectContaining({ title: "Buy milk" }) });
    expect(await service.list()).toEqual([expect.objectContaining({ title: "Buy milk" })]);
  });

  it("returns a validation failure without touching the repository", async () => {
    const notesRepo = createFakeNotesRepository();
    const insert = vi.spyOn(notesRepo, "insert");
    const service = createNotesService({ notesRepo });

    const result = await service.create({ title: "   " });

    expect(result).toEqual({
      ok: false,
      error: { code: "validation", fields: { title: ["required"] } },
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects input that is not an object", async () => {
    const service = createNotesService({ notesRepo: createFakeNotesRepository() });

    expect(await service.create("drop table notes")).toMatchObject({
      ok: false,
      error: { code: "validation" },
    });
  });
});
