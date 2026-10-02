import { describe, expect, it } from "vitest";
import { getPathLocale, localizePath } from "./localize-path";

describe("getPathLocale", () => {
  it("reads a supported locale prefix", () => {
    expect(getPathLocale("/pt")).toBe("pt");
    expect(getPathLocale("/en/notes")).toBe("en");
  });

  it("ignores unsupported or partial prefixes", () => {
    expect(getPathLocale("/")).toBeUndefined();
    expect(getPathLocale("/fr/notes")).toBeUndefined();
    expect(getPathLocale("/english")).toBeUndefined();
  });
});

describe("localizePath", () => {
  it("adds a prefix to unprefixed paths", () => {
    expect(localizePath("/", "pt")).toBe("/pt");
    expect(localizePath("/notes/1", "en")).toBe("/en/notes/1");
  });

  it("replaces an existing prefix", () => {
    expect(localizePath("/en", "pt")).toBe("/pt");
    expect(localizePath("/en/notes", "pt")).toBe("/pt/notes");
  });
});
