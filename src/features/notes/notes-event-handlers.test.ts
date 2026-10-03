// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createFakeOutbox } from "@/server/events/fake-outbox";
import { createFakeUnitOfWork } from "@/server/fake-unit-of-work";
import { createFakeNotesRepository } from "@/server/notes/fake-notes-repository";
import { createNotesEventHandlers } from "./notes-event-handlers";
import { notesRealtimeEvents } from "./notes-events";

const NOW = new Date("2026-01-01T00:00:00.000Z");

async function setup() {
  const notesRepo = createFakeNotesRepository();
  const outbox = createFakeOutbox();
  const note = await notesRepo.insert({ title: "work" });
  const handlers = createNotesEventHandlers({
    transaction: createFakeUnitOfWork({ notesRepo, outbox }),
    clock: () => NOW,
  });
  const onCreated = (event: unknown) =>
    Promise.all((handlers["note.created"] ?? []).map((handle) => handle(event as never)));
  return { notesRepo, outbox, note, onCreated };
}

describe("notes event handlers", () => {
  it("processes a created note and emits note.processed", async () => {
    const { notesRepo, outbox, note, onCreated } = await setup();

    await onCreated({ type: "note.created", noteId: note.id });

    expect((await notesRepo.list())[0]?.processedAt).toEqual(NOW);
    expect(outbox.rows().map((row) => row.payload)).toEqual([
      { type: "note.processed", noteId: note.id },
    ]);
  });

  it("is idempotent when the event is delivered twice", async () => {
    const { outbox, note, onCreated } = await setup();

    await onCreated({ type: "note.created", noteId: note.id });
    await onCreated({ type: "note.created", noteId: note.id });

    expect(outbox.rows()).toHaveLength(1);
  });

  it("rejects malformed payloads so the processor retries / dead-letters them", async () => {
    const { onCreated } = await setup();

    await expect(onCreated({ type: "note.created", noteId: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("notesRealtimeEvents", () => {
  it("invalidates every notes query for notes events only", () => {
    const noteId = crypto.randomUUID();
    expect(notesRealtimeEvents({ type: "note.processed", noteId })).toEqual([["notes"]]);
    expect(notesRealtimeEvents({ type: "user.created", noteId })).toBeNull();
  });
});
