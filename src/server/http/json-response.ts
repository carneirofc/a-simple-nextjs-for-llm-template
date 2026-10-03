import "server-only";
import type { ActionError } from "@/lib/action-result";
import { createEtag, matchesEtag } from "@/lib/http-cache";

type CacheOptions = {
  /** Defaults to revalidating on every request: safe for any data, cheap thanks to `304`. */
  cacheControl?: string;
};

/** JSON response with a strong `ETag`; answers `If-None-Match` with `304 Not Modified`. */
export async function jsonWithEtag(
  request: Request,
  body: unknown,
  { cacheControl = "private, no-cache" }: CacheOptions = {},
): Promise<Response> {
  const json = JSON.stringify(body);
  const headers = new Headers({ "cache-control": cacheControl, etag: await createEtag(json) });
  if (matchesEtag(request.headers.get("if-none-match"), headers.get("etag") ?? "")) {
    return new Response(null, { status: 304, headers });
  }
  headers.set("content-type", "application/json");
  return new Response(json, { status: 200, headers });
}

const STATUS_BY_CODE: Record<ActionError["code"], number> = {
  validation: 422,
  notFound: 404,
  conflict: 409,
  forbidden: 403,
};

/** RFC 9457 problem details. `code` matches `ActionError` codes so every client maps one set. */
export function problem(error: ActionError): Response {
  const status = STATUS_BY_CODE[error.code];
  return Response.json(
    { type: "about:blank", status, ...error },
    {
      status,
      headers: { "content-type": "application/problem+json", "cache-control": "no-store" },
    },
  );
}
