import type { Locale } from "./config";

/**
 * Locale-aware date + time. Pinned to UTC (and labelled) so server and client render the same
 * string — a per-user time zone would otherwise cause hydration mismatches.
 */
export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}
