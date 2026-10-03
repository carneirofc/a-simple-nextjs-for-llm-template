import { describe, expect, it } from "vitest";
import { formatSseMessage, formatSseRetry, SSE_HEARTBEAT } from "./sse";

describe("sse", () => {
  it("formats a message with id and JSON data", () => {
    expect(formatSseMessage({ id: "1", data: { type: "a", text: "x\ny" } })).toBe(
      'id: 1\ndata: {"type":"a","text":"x\\ny"}\n\n',
    );
  });

  it("omits the id line when there is none", () => {
    expect(formatSseMessage({ data: 1 })).toBe("data: 1\n\n");
  });

  it("formats retry and heartbeat frames", () => {
    expect(formatSseRetry(3000)).toBe("retry: 3000\n\n");
    expect(SSE_HEARTBEAT.startsWith(":")).toBe(true);
  });
});
