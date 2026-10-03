import { describe, expect, it } from "vitest";
import { createEtag, matchesEtag } from "./http-cache";

describe("createEtag", () => {
  it("is a quoted, stable hash of the body", async () => {
    const etag = await createEtag('{"a":1}');
    expect(etag).toMatch(/^"[0-9a-f]{32}"$/);
    expect(await createEtag('{"a":1}')).toBe(etag);
    expect(await createEtag('{"a":2}')).not.toBe(etag);
  });
});

describe("matchesEtag", () => {
  const etag = '"abc"';

  it("matches exact, weak, listed and wildcard values", () => {
    expect(matchesEtag('"abc"', etag)).toBe(true);
    expect(matchesEtag('W/"abc"', etag)).toBe(true);
    expect(matchesEtag('"x", "abc"', etag)).toBe(true);
    expect(matchesEtag("*", etag)).toBe(true);
  });

  it("does not match a missing or different value", () => {
    expect(matchesEtag(null, etag)).toBe(false);
    expect(matchesEtag('"abd"', etag)).toBe(false);
  });
});
