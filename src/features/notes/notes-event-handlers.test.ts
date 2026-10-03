// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { HandlerContext } from "@/server/events/domain-event";
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
    notesRepo,
    transaction: createFakeUnitOfWork({ notesRepo, outbox }),
    clock: () => NOW,
    sleep: () => Promise.resolve(),
  });
  const context: HandlerContext = {
    jobId: crypto.randomUUID(),
    attempt: 1,
    reportProgress: vi.fn().mockResolvedValue(undefined),
  };
  const run = (event: { type: string } & Record<string, unknown>) =>
    Promise.all((handlers[event.type] ?? []).map((handle) => handle(event, context)));
  return { notesRepo, outbox, note, run, context };
}

describe("note.created handler", () => {
  it("processes a created note and emits note.processed", async () => {
    const { notesRepo, outbox, note, run } = await setup();

    await run({ type: "note.created", noteId: note.id });

    expect((await notesRepo.list())[0]?.processedAt).toEqual(NOW);
    expect(outbox.rows().map((row) => row.payload)).toEqual([
      { type: "note.processed", noteId: note.id },
    ]);
  });

  it("is idempotent when the event is delivered twice", async () => {
    const { outbox, note, run } = await setup();

    await run({ type: "note.created", noteId: note.id });
    await run({ type: "note.created", noteId: note.id });

    expect(outbox.rows()).toHaveLength(1);
  });

  it("rejects malformed payloads so the processor retries / dead-letters them", async () => {
    const { run } = await setup();

    await expect(run({ type: "note.created", noteId: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("notes.report-requested handler", () => {
  it("reports progress in steps and returns the report", async () => {
    const { run, context } = await setup();

    const [report] = await run({ type: "notes.report-requested" });

    expect(report).toEqual({ noteCount: 1, processedCount: 0 });
    expect(vi.mocked(context.reportProgress).mock.calls).toEqual([[25], [50], [75], [100]]);
  });
});

describe("notesRealtimeEvents", () => {
  it("invalidates every notes query for notes events only", () => {
    const noteId = crypto.randomUUID();
    expect(notesRealtimeEvents({ type: "note.processed", noteId })).toEqual([["notes"]]);
    expect(notesRealtimeEvents({ type: "user.created", noteId })).toBeNull();
  });
});
