import { describe, expect, it } from "vitest";
import { negotiateLocale } from "./negotiate";

describe("negotiateLocale", () => {
  it("falls back to the default locale", () => {
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale("")).toBe("en");
    expect(negotiateLocale("fr-FR,de;q=0.8")).toBe("en");
  });

  it("matches a region tag by its base language", () => {
    expect(negotiateLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
  });

  it("respects quality values over header order", () => {
    expect(negotiateLocale("en;q=0.5, pt;q=0.9")).toBe("pt");
  });

  it("ignores wildcards and q=0", () => {
    expect(negotiateLocale("*, pt;q=0")).toBe("en");
  });

  it("is case-insensitive", () => {
    expect(negotiateLocale("PT-br")).toBe("pt");
  });
});
