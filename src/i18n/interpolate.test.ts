import { describe, expect, it } from "vitest";
import { interpolate } from "./interpolate";

describe("interpolate", () => {
  it("replaces known placeholders", () => {
    expect(interpolate("{count} of {max}", { count: 3, max: 10 })).toBe("3 of 10");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("Hi {name}", {})).toBe("Hi {name}");
  });
});
