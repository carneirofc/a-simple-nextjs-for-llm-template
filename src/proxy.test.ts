// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("redirects unprefixed paths using Accept-Language", () => {
    const response = proxy(request("/notes?x=1", { "accept-language": "pt-BR,pt;q=0.9" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/pt-BR/notes?x=1");
  });

  it("prefers the locale cookie over Accept-Language", () => {
    const response = proxy(request("/", { "accept-language": "pt", cookie: "NEXT_LOCALE=en" }));
    expect(response.headers.get("location")).toBe("http://localhost:3000/en");
  });

  it("passes prefixed paths through and remembers the locale", () => {
    const response = proxy(request("/pt-BR/notes"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get("NEXT_LOCALE")?.value).toBe("pt-BR");
  });

  it("does not rewrite an unchanged cookie", () => {
    const response = proxy(request("/en", { cookie: "NEXT_LOCALE=en" }));
    expect(response.cookies.get("NEXT_LOCALE")).toBeUndefined();
  });
});
