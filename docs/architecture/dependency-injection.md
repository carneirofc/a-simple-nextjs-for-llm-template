# Inversion of control and dependency injection

## Decision

**Function-based DI with a single composition root. No DI container.**

Containers such as InversifyJS or tsyringe rely on decorators and `reflect-metadata`, hide the dependency graph from the type checker, and fight the bundler: a container that knows every service also drags server code toward client bundles and breaks tree-shaking. The things a container gives you (swap implementations, fake in tests, control lifetimes) are achieved here with plain functions:

| Need | How |
| --- | --- |
| Depend on an abstraction | a **port**: a TypeScript type describing behaviour (`NotesRepository`, `PaymentsGateway`) |
| Provide an implementation | a **factory**: `createDrizzleNotesRepository(db)` returns an object matching the port |
| Wire everything once | the **composition root** `src/server/container.ts` |
| Singleton per process | lazy getter on `globalThis` (same pattern as `getDb()` — survives dev HMR) |
| Scope per request | React `cache()` around a getter (dedupes within one server render) |
| Fake in tests | pass a hand-written fake object in `deps`; no `vi.mock` of module paths |

Ports are behaviour, not data, so writing them as `type` is allowed; the data they carry still comes from Zod (`z.infer`).

## Shape (the `notes` reference implementation)

```ts
// src/server/notes/notes-ports.ts — port: behaviour the use cases need (lives in src/server so adapters can implement it)
export type NotesRepository = {
  readonly list: () => Promise<Note[]>;
  readonly insert: (values: NewNote) => Promise<Note>;
};

// src/server/notes/drizzle-notes-repository.ts — adapter (+ fake-notes-repository.ts for tests)
export function createDrizzleNotesRepository(db: Database): NotesRepository { … }

// src/server/container.ts — composition root: the only place that chooses implementations
async function createContainer() {
  const db = await getDb();
  return { notesRepo: createDrizzleNotesRepository(db) };
}
export type Container = Awaited<ReturnType<typeof createContainer>>;
export function getContainer(): Promise<Container> { /* lazy, cached on globalThis like getDb() */ }

// src/features/notes/data.ts — use cases take one `deps` object (≤ 3 params rule)
export function createNotesService({ notesRepo }: Pick<Container, "notesRepo">) {
  return { list: …, create: async (input: unknown): Promise<ActionResult<Note>> => … };
}
export async function getNotesService() {
  return createNotesService(await getContainer());
}

// src/features/notes/actions.ts and src/app/api/v1/notes/route.ts — transports stay thin
export async function createNote(input: unknown) {
  return (await getNotesService()).create(input);
}
```

The container lives in `src/server` and must not import `src/features` (Biome-enforced), so it wires **adapters**; each feature builds its service from them. The dependency graph stays one-directional: `features → server`, never back.

## Rules

- **Persistence goes through a repository port** per feature (as `notes` does), so use cases are tested with a fake and the Drizzle adapter is tested once by the contract test. Add other ports only where there is a seam: an external backend, a second implementation (provider A vs. B), or something a test must fake (clock, ID generator, mailer).
- **Only `src/server/container.ts` reads env to pick an implementation** (Strategy pattern). Features never branch on `env.*` to choose an adapter.
- **Lifetimes:** process-wide things (DB pool, HTTP clients, gateways) are lazy singletons; anything that depends on the caller (session, user, locale, permissions) is resolved per request and passed as an argument, never stored on a singleton.
- **Request context:** in Server Components, wrap per-request lookups with React `cache()` (`getCurrentUser = cache(async () => …)`); in actions and route handlers, resolve them at the top of the function and pass them down. Do not build a home-grown `AsyncLocalStorage` context.
- **Importing a module has no side effects.** No connections, timers or subscriptions at import time; everything starts in a getter (keeps `next build` and tests offline).
- **Factories take one `deps` object** and return a plain object of functions. No classes, no `this`.
- **Tests** build the service with fakes: `createNotesService({ notesRepo: createFakeNotesRepository() })`. Keep fakes next to the port as `fake-<name>.ts`, and run one contract test (`describe.each` over fake + real adapter) so the fake cannot drift from the real thing. Route-handler tests may `vi.mock("@/server/container")`: the composition root is the one seam to replace there.
- The container is `server-only`; client components never see it. Client-side "DI" is React props (and, later, Jotai atoms), not a container.
