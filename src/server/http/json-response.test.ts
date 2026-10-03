// @vitest-environment node
import { describe, expect, it } from "vitest";
import { jsonWithEtag, problem } from "./json-response";

const URL = "http://localhost/api/v1/things";

describe("jsonWithEtag", () => {
  it("returns JSON with an ETag and revalidation cache headers", async () => {
    const response = await jsonWithEtag(new Request(URL), { items: [1] });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
    expect(response.headers.get("etag")).toMatch(/^".+"$/);
    expect(await response.json()).toEqual({ items: [1] });
  });

  it("returns 304 without a body when the ETag matches", async () => {
    const first = await jsonWithEtag(new Request(URL), { items: [1] });
    const etag = first.headers.get("etag") ?? "";

    const second = await jsonWithEtag(new Request(URL, { headers: { "if-none-match": etag } }), {
      items: [1],
    });

    expect(second.status).toBe(304);
    expect(second.headers.get("etag")).toBe(etag);
    expect(await second.text()).toBe("");
  });

  it("accepts a custom Cache-Control", async () => {
    const response = await jsonWithEtag(
      new Request(URL),
      {},
      { cacheControl: "public, max-age=60" },
    );
    expect(response.headers.get("cache-control")).toBe("public, max-age=60");
  });
});

describe("problem", () => {
  it("maps the error code to an HTTP status in problem+json", async () => {
    const response = problem({ code: "validation", fields: { title: ["required"] } });

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toBe("application/problem+json");
    expect(await response.json()).toEqual({
      type: "about:blank",
      status: 422,
      code: "validation",
      fields: { title: ["required"] },
    });
  });
});
