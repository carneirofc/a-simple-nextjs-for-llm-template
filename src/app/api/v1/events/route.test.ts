// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBroker } from "@/server/events/event-broker";
import { GET } from "./route";

const broker = createInMemoryEventBroker();

// The composition root is the seam: the real route + filter, an in-memory broker.
vi.mock("@/server/container", () => ({
  getContainer: () => Promise.resolve({ eventBroker: broker }),
}));

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const { value } = await reader.read();
  return new TextDecoder().decode(value);
}

describe("GET /api/v1/events", () => {
  it("streams public events and drops internal ones", async () => {
    const controller = new AbortController();
    const response = await GET(new Request("http://localhost/api/v1/events", controller));
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    await readChunk(reader); // retry frame
    const noteId = crypto.randomUUID();

    broker.publish({ id: "e1", occurredAt: new Date(), event: { type: "internal.audit" } });
    broker.publish({ id: "e2", occurredAt: new Date(), event: { type: "note.processed", noteId } });

    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(await readChunk(reader)).toBe(
      `id: e2\ndata: {"type":"note.processed","noteId":"${noteId}"}\n\n`,
    );
    controller.abort();
  });
});
