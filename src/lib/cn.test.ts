import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("lets later Tailwind classes override earlier ones", () => {
    expect(cn("px-4 py-2", "px-2")).toBe("py-2 px-2");
  });

  it("supports conditional object syntax", () => {
    expect(cn({ "sr-only": true, hidden: false })).toBe("sr-only");
  });
});
