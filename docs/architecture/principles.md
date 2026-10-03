# Coding principles

Short rules with the reason behind each. They complement the size limits in `AGENTS.md`: small modules are only useful if each one has one clear job and explicit dependencies.

## Structure

- **Functional core, imperative shell.** Decisions (validation, calculations, mapping, permission checks) are pure functions in `src/lib/<name>.ts` or `<feature>-<name>.ts` and get unit tests without mocks. I/O (DB, fetch, cookies, time, randomness) stays in the thin shell that calls them (`data.ts`, gateways).
- **Single responsibility per module, one direction of change.** If two unrelated reasons would make you edit a file, split it. The 150-line / 40-line limits are the alarm, not the goal.
- **Explicit dependencies.** A function gets what it needs as an argument (`deps`) or imports a lazy getter (`getDb()`), never reads hidden module state set somewhere else. See [dependency-injection.md](dependency-injection.md).
- **Composition over inheritance.** No class hierarchies. Plain functions and objects; a class only when a library requires one (e.g. an `Error` subclass).
- **Rule of three for abstractions.** Duplicate twice, abstract on the third occurrence. Exception: a boundary to an external system always gets a port from the start (it is the seam tests and swaps need).
- **Deep modules, small interfaces.** Export the fewest functions that cover the use cases; keep helpers private to the file.

## Data and types

- **Parse, don't validate.** Turn `unknown` into a typed value with a Zod schema at the boundary, then pass the typed value on. Never re-check the same invariant deeper in the core.
- **Make illegal states unrepresentable.** Model variants as discriminated unions (`z.discriminatedUnion("status", …)`), not optional fields plus booleans. `switch` on the tag with an exhaustive `never` check.
- **Immutable by default.** Do not mutate arguments, props or cached objects; return new values. Mark port and DTO fields `readonly` when you write the type by hand (component props, ports).
- **DTOs at the edges.** What leaves the server (action result, API response, event payload) is a schema chosen for the consumer, not a raw DB row. Derive it (`noteSelectSchema.pick({ … })`) for internal UI; write it explicitly for public APIs so a DB change cannot silently change the contract (see [integrations.md](integrations.md)).
- **Time and randomness are inputs.** Pass `now: Date` or a `clock` dependency rather than calling `new Date()` deep in logic: tests become deterministic and cached functions stay pure.
- **Idempotent writes.** Any write a client or backend may retry (network errors, webhooks, double clicks) must be safe to repeat: upsert by natural key, or accept an idempotency key.

## Errors

- **Expected errors are values; unexpected errors are thrown.**
  - Expected = the caller can act on it: validation failed, not found, conflict, forbidden, rate limited. Return a `Result` (`{ ok: true, data } | { ok: false, error: { code, fields? } }`) from actions and use cases. `code` is a dictionary key so the UI can translate it.
  - Unexpected = a bug or an outage. Throw an `Error` with a message; let `error.tsx` / the route handler's 500 path show `error.digest` only.
- **Fail fast at startup, degrade at runtime.** Misconfiguration (env) throws on boot via `src/env.ts`; a slow or failing optional backend renders a fallback section instead of failing the page.
- **Never swallow.** Every `catch` either handles the error (and says how in a comment), converts it to a `Result`, or rethrows with `cause`.

## Server/client boundary

- Server Components by default; `"use client"` only on interactive leaves.
- Client components import `@/server/**` only as `import type`, with one tolerated exception: Zod schemas from `src/server/db/schema/*` (no `server-only` there, but they pull Drizzle into the bundle). New client forms take their schema from plain-Zod `<feature>/<feature>-schema.ts`; the server refines the DB schema from it.
- `"server-only"` on every module that touches secrets, the DB or backends.

## Testing

- Pure functions: plain unit tests, no mocks.
- Use cases: pass fakes through `deps` (in-memory repository, fixed clock) instead of `vi.mock` on module paths.
- Gateways: test the mapper with recorded backend payloads (fixtures); test the HTTP client against a fake `fetch` passed in `deps`.
- Components: through props and roles, as today.
