import { describe, expect, it } from "vitest";
import { NOTE_TITLE_MAX, noteInsertSchema } from "./schema/notes";

describe("noteInsertSchema", () => {
  it("trims the title", () => {
    expect(noteInsertSchema.parse({ title: "  hello  " })).toEqual({ title: "hello" });
  });

  it("rejects blank titles", () => {
    const result = noteInsertSchema.safeParse({ title: "   " });
    expect(result.error?.issues[0]?.message).toBe("required");
  });

  it("rejects titles over the max length", () => {
    const title = "x".repeat(NOTE_TITLE_MAX + 1);
    expect(noteInsertSchema.safeParse({ title }).success).toBe(false);
  });
});
