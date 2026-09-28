// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

function loadFlags() {
  vi.resetModules();
  return import("./flags");
}

describe("flags", () => {
  beforeEach(() => {
    vi.stubEnv("FEATURE_AUTH", "");
    vi.stubEnv("FEATURE_NOTES_EXAMPLE", "");
  });

  it("uses defaults when env vars are unset", async () => {
    const { flags } = await loadFlags();
    expect(flags).toEqual({ auth: false, notesExample: true });
  });

  it("reads FEATURE_* env vars", async () => {
    vi.stubEnv("FEATURE_NOTES_EXAMPLE", "false");
    const { isEnabled } = await loadFlags();
    expect(isEnabled("notesExample")).toBe(false);
  });

  it("requires auth secrets when FEATURE_AUTH=true", async () => {
    vi.stubEnv("FEATURE_AUTH", "true");
    await expect(loadFlags()).rejects.toThrow(/environment variables/i);
  });
});
