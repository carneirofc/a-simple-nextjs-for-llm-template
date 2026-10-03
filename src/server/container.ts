import "server-only";
import { getDb } from "./db/client";
import { createDrizzleNotesRepository } from "./notes/drizzle-notes-repository";

/**
 * Composition root: the only place that chooses port implementations (adapters). Features build
 * their services from it (`createNotesService(await getContainer())`); tests pass fakes instead.
 */
async function createContainer() {
  const db = await getDb();
  return {
    notesRepo: createDrizzleNotesRepository(db),
  };
}

export type Container = Awaited<ReturnType<typeof createContainer>>;

// Process-wide singleton that survives dev hot reloads, like `getDb()`.
const globalForContainer = globalThis as typeof globalThis & {
  containerPromise?: Promise<Container> | undefined;
};

/** Lazily wires adapters on first call, so importing this module has no side effects. */
export function getContainer(): Promise<Container> {
  globalForContainer.containerPromise ??= createContainer().catch((error: unknown) => {
    // Don't cache failures; the next call retries.
    globalForContainer.containerPromise = undefined;
    throw error;
  });
  return globalForContainer.containerPromise;
}
