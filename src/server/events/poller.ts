type PollingOptions = {
  readonly run: () => Promise<unknown>;
  readonly intervalMs: number;
  readonly onError: (error: unknown) => void;
};

/**
 * Runs `run` now and then `intervalMs` after each run finishes (never overlapping). Timers are
 * `unref`'d so polling never keeps a process alive on its own. Returns `stop`.
 */
export function startPolling({ run, intervalMs, onError }: PollingOptions): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = (delay: number) => {
    timer = setTimeout(() => {
      run()
        .catch(onError)
        .finally(() => {
          if (!stopped) {
            schedule(intervalMs);
          }
        });
    }, delay);
    timer.unref?.();
  };

  schedule(0);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
