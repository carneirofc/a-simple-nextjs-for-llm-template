// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createFakeOutbox } from "@/server/events/fake-outbox";
import { createFakeUnitOfWork } from "@/server/fake-unit-of-work";
import { createFakeNotesRepository } from "@/server/notes/fake-notes-repository";
import { createNotesService } from "./data";

// Use cases are tested through injected fakes: no database, no module mocks.

function setup() {
  const notesRepo = createFakeNotesRepository();
  const outbox = createFakeOutbox();
  const transaction = createFakeUnitOfWork({ notesRepo, outbox });
  return { notesRepo, outbox, service: createNotesService({ notesRepo, transaction }) };
}

describe("notes service", () => {
  it("creates a note from valid input", async () => {
    const { service } = setup();

    const result = await service.create({ title: "  Buy milk " });

    expect(result).toEqual({ ok: true, data: expect.objectContaining({ title: "Buy milk" }) });
    expect(await service.list()).toEqual([expect.objectContaining({ title: "Buy milk" })]);
  });

  it("enqueues note.created with the new note id", async () => {
    const { service, outbox } = setup();

    const result = await service.create({ title: "Buy milk" });

    const noteId = result.ok ? result.data.id : "";
    expect(outbox.rows()).toEqual([
      expect.objectContaining({ type: "note.created", payload: { type: "note.created", noteId } }),
    ]);
  });

  it("returns a validation failure without writing anything", async () => {
    const { service, notesRepo, outbox } = setup();
    const insert = vi.spyOn(notesRepo, "insert");

    const result = await service.create({ title: "   " });

    expect(result).toEqual({
      ok: false,
      error: { code: "validation", fields: { title: ["required"] } },
    });
    expect(insert).not.toHaveBeenCalled();
    expect(outbox.rows()).toEqual([]);
  });

  it("rejects input that is not an object", async () => {
    const { service } = setup();

    expect(await service.create("drop table notes")).toMatchObject({
      ok: false,
      error: { code: "validation" },
    });
  });
});
