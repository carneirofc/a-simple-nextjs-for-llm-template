const ETAG_BYTES = 16;

/** Strong ETag for a response body (SHA-256, truncated). Web Crypto, so it runs on any runtime. */
export async function createEtag(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(digest).slice(0, ETAG_BYTES), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `"${hex}"`;
}

/** `If-None-Match` check (RFC 9110 weak comparison): `*`, lists and `W/` prefixes are handled. */
export function matchesEtag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) {
    return false;
  }
  const strip = (tag: string) => tag.trim().replace(/^W\//, "");
  return ifNoneMatch.split(",").some((tag) => tag.trim() === "*" || strip(tag) === strip(etag));
}
