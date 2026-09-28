import { describe, expect, it } from "vitest";
import { NOTE_TITLE_MAX, noteInsertSchema } from "./schema/notes";

describe("noteInsertSchema", () => {
  it("trims the title", () => {
    expect(noteInsertSchema.parse({ title: "  hello  " })).toEqual({ title: "hello" });
  });

  it("rejects blank titles", () => {
    expect(noteInsertSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("rejects titles over the max length", () => {
    const title = "x".repeat(NOTE_TITLE_MAX + 1);
    expect(noteInsertSchema.safeParse({ title }).success).toBe(false);
  });
});
