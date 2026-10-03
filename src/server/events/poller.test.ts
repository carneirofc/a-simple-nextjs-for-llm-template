import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startPolling } from "./poller";

describe("startPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs immediately, then after each interval, until stopped", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const stop = startPolling({ run, intervalMs: 1000, onError: vi.fn() });

    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("reports errors and keeps polling", async () => {
    const onError = vi.fn();
    const run = vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValue(undefined);
    const stop = startPolling({ run, intervalMs: 1000, onError });

    await vi.advanceTimersByTimeAsync(1000);

    expect(onError).toHaveBeenCalledWith(new Error("db down"));
    expect(run).toHaveBeenCalledTimes(2);
    stop();
  });
});
