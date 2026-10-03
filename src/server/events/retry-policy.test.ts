import { describe, expect, it } from "vitest";
import { nextAttemptAt } from "./retry-policy";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const delay = (attempts: number) => nextAttemptAt(attempts, NOW).getTime() - NOW.getTime();

describe("nextAttemptAt", () => {
  it("doubles the delay per attempt", () => {
    expect([1, 2, 3, 4].map(delay)).toEqual([2000, 4000, 8000, 16_000]);
  });

  it("caps the delay at five minutes", () => {
    expect(delay(20)).toBe(5 * 60_000);
  });
});
