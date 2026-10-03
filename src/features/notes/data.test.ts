// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBroker } from "@/server/events/event-broker";
import { createFakeNotesRepository } from "@/server/notes/fake-notes-repository";
import { createNotesService } from "./data";

// Use cases are tested through injected fakes: no database, no module mocks.

function setup() {
  const notesRepo = createFakeNotesRepository();
  const eventBroker = createInMemoryEventBroker();
  const published = vi.fn();
  eventBroker.subscribe(published);
  return { notesRepo, published, service: createNotesService({ notesRepo, eventBroker }) };
}

describe("notes service", () => {
  it("creates a note from valid input", async () => {
    const { service } = setup();

    const result = await service.create({ title: "  Buy milk " });

    expect(result).toEqual({ ok: true, data: expect.objectContaining({ title: "Buy milk" }) });
    expect(await service.list()).toEqual([expect.objectContaining({ title: "Buy milk" })]);
  });

  it("publishes note.created after the write", async () => {
    const { service, published } = setup();

    const result = await service.create({ title: "Buy milk" });

    const noteId = result.ok ? result.data.id : "";
    expect(published).toHaveBeenCalledWith({ type: "note.created", noteId });
  });

  it("returns a validation failure without writing or publishing", async () => {
    const { service, notesRepo, published } = setup();
    const insert = vi.spyOn(notesRepo, "insert");

    const result = await service.create({ title: "   " });

    expect(result).toEqual({
      ok: false,
      error: { code: "validation", fields: { title: ["required"] } },
    });
    expect(insert).not.toHaveBeenCalled();
    expect(published).not.toHaveBeenCalled();
  });

  it("rejects input that is not an object", async () => {
    const { service } = setup();

    expect(await service.create("drop table notes")).toMatchObject({
      ok: false,
      error: { code: "validation" },
    });
  });
});
