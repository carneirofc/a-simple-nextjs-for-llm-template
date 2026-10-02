import { describe, expect, it } from "vitest";
import { negotiateLocale } from "./negotiate";

describe("negotiateLocale", () => {
  it("falls back to the default locale", () => {
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale("")).toBe("en");
    expect(negotiateLocale("fr-FR,de;q=0.8")).toBe("en");
  });

  it("matches an exact tag case-insensitively", () => {
    expect(negotiateLocale("pt-br,en;q=0.8")).toBe("pt-BR");
  });

  it("matches by base language when the region differs", () => {
    expect(negotiateLocale("pt")).toBe("pt-BR");
    expect(negotiateLocale("pt-PT")).toBe("pt-BR");
    expect(negotiateLocale("en-GB")).toBe("en");
  });

  it("respects quality values over header order", () => {
    expect(negotiateLocale("en;q=0.5, pt-BR;q=0.9")).toBe("pt-BR");
  });

  it("ignores wildcards and q=0", () => {
    expect(negotiateLocale("*, pt-BR;q=0")).toBe("en");
  });
});
