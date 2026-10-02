import { describe, expect, it } from "vitest";
import { formatDateTime } from "./format";

const DATE = new Date("2026-01-02T15:04:00.000Z");

// Exact output varies across ICU versions (spaces, punctuation); assert the locale-specific parts.
describe("formatDateTime", () => {
  it("formats in English with a 12-hour clock", () => {
    expect(formatDateTime(DATE, "en")).toMatch(/^Jan 2, 2026.*03:04\sPM UTC$/);
  });

  it("formats in Portuguese with a 24-hour clock", () => {
    expect(formatDateTime(DATE, "pt")).toMatch(/^2 de jan\. de 2026.*15:04 UTC$/);
  });
});
