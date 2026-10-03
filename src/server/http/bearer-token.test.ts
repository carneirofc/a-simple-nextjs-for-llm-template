// @vitest-environment node
import { describe, expect, it } from "vitest";
import { bearerTokenMatches } from "./bearer-token";

const SECRET = "s".repeat(32);

describe("bearerTokenMatches", () => {
  it("accepts the exact bearer token", () => {
    expect(bearerTokenMatches(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects missing, malformed or wrong tokens", () => {
    expect(bearerTokenMatches(null, SECRET)).toBe(false);
    expect(bearerTokenMatches(SECRET, SECRET)).toBe(false);
    expect(bearerTokenMatches("Bearer ", SECRET)).toBe(false);
    expect(bearerTokenMatches("Bearer wrong", SECRET)).toBe(false);
  });
});
