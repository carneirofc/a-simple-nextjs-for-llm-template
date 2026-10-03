import { describe, expect, it } from "vitest";
import { NOTE_TITLE_MAX, noteInputSchema } from "./notes-schema";

describe("noteInputSchema", () => {
  it("trims the title", () => {
    expect(noteInputSchema.parse({ title: "  hello  " })).toEqual({ title: "hello" });
  });

  it("rejects blank titles", () => {
    const result = noteInputSchema.safeParse({ title: "   " });
    expect(result.error?.issues[0]?.message).toBe("required");
  });

  it("rejects titles over the max length", () => {
    const title = "x".repeat(NOTE_TITLE_MAX + 1);
    expect(noteInputSchema.safeParse({ title }).error?.issues[0]?.message).toBe("tooLong");
  });
});
