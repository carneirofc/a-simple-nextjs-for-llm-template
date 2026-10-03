import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time check of an `Authorization: Bearer <token>` header against the expected secret. */
export function bearerTokenMatches(header: string | null, secret: string): boolean {
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  // Hash both sides so lengths match and timing does not leak the secret's length.
  return token.length > 0 && timingSafeEqual(digest(token), digest(secret));
}
