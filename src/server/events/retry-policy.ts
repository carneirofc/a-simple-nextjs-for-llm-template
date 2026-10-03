const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 5 * 60_000;

/** Exponential backoff (2 s, 4 s, 8 s, … capped at 5 min) for the given failed attempt number. */
export function nextAttemptAt(attempts: number, now: Date): Date {
  const exponent = Math.max(0, attempts - 1);
  const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** exponent);
  return new Date(now.getTime() + delay);
}
