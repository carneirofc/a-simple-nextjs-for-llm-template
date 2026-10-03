# src/server

## Purpose

Server-only code: database access and authentication. Every module imports `"server-only"`.

## Ownership

- `db/client.ts` — `getDb()` lazy singleton; exports `schema` and `Database` type.
- `db/schema/*.ts` — Drizzle `pgTable` definitions + derived Zod schemas + `z.infer` types. One file per domain.
- `auth.ts` — Better Auth instance via `getAuth()`.
- `../../drizzle/` — generated SQL migrations (commit them, never edit by hand).
- `container.ts` — composition root: `getContainer()` lazy singleton wiring adapters (`notesRepo`, …). The only place that picks implementations.
- `<domain>/<domain>-ports.ts` (behaviour types) + adapters (`drizzle-<domain>-repository.ts`, `fake-<domain>-repository.ts`) + one contract test over both (`<domain>-repository.test.ts`, PGlite in memory). Reference: `notes/`.
- `http/json-response.ts` — `jsonWithEtag` (ETag/304) and `problem` (RFC 9457) for route handlers.
- `unit-of-work.ts` — `transaction(work)` port + Drizzle adapter: ports bound to one DB transaction (`notesRepo`, `outbox`); `fake-unit-of-work.ts` for tests. Add every new transactional repository to `TransactionScope`.
- `events/` — `MessageQueue` port (`enqueue` → `{ id }`, options `runAt`/`maxAttempts`) + `OutboxStore` (claim/get/progress/complete/retry/fail) with Drizzle and fake adapters, `job-updates.ts` (`job.updated` lifecycle events); outbox ports/adapters (`drizzle-outbox.ts`, `fake-outbox.ts`, contract test), `event-processor.ts` (claim → handlers → done/retry/failed → publish), `retry-policy.ts`, `poller.ts`, `event-broker.ts` (in-memory fan-out port), `domain-event.ts` (generic schemas, handler types).
- `db/schema/outbox.ts` — `outbox_events` table (queue + dead letter).
- `http/event-stream.ts` (SSE responses), `http/bearer-token.ts` (constant-time shared-secret check).
- When needed (see `docs/architecture/`): `integrations/<backend>/` (gateway per external backend), a `LISTEN/NOTIFY` `EventBroker` adapter for multi-instance realtime.

## Local Contracts

- **DB driver selection:** `DATABASE_URL` set ⇒ `postgres` (postgres-js). Unset ⇒ PGlite (dev/test only) at `./.data/pglite`, migrations applied automatically on first `getDb()`. Production without `DATABASE_URL` throws on first use.
- Importing `db/client.ts` must never connect; connect only inside `getDb()` (keeps `next build` DB-free).
- Single Postgres dialect everywhere; never add `sqliteTable`/other dialects.
- Column names are camelCase in TS, snake_case in SQL (`casing: "snake_case"` in drizzle config and client); don't pass explicit column-name strings.
- Each table file exports `<name>SelectSchema`, `<name>InsertSchema` (plain `drizzle-zod` DB shapes, no user-facing rules) and `type X = z.infer<...>`. User input rules live in `src/features/<name>/<name>-schema.ts`. Never redeclare shapes.
- New schema file ⇒ add it to the `schema` object in `db/client.ts`.
- Migrations: `pnpm db:generate` after schema edits; prod applies with `pnpm db:migrate` (with `DATABASE_URL`).
- **Auth:** `getAuth()` returns `null` unless `FEATURE_AUTH=true`; env validation requires `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` in that case. Auth tables in `db/schema/auth.ts` must match Better Auth's model names (`user`, `session`, `account`, `verification`); update them when adding Better Auth plugins that extend the schema.

- **Layering:** never import `@/app`, `@/features` or `@/components` (Biome-enforced). The container wires adapters; features build their services from it.
- **No import-time side effects:** connect/start only inside lazy getters (`getDb()`, `getAuth()`, `getContainer()`), cached on `globalThis` when HMR would duplicate them.
- **Ports & adapters:** every feature's persistence is a repository port (Drizzle adapter + fake, shared contract test); add other ports only for an external system, a second implementation, or something tests must fake (clock, ids, mailer). Adapters are `create<Name>(deps)` factories returning plain objects. Only `container.ts` reads env to choose an adapter. Adapters are the only callers of `getDb()` besides `auth.ts`.
- **Integrations:** `integrations/<backend>/` = `<backend>-client.ts` (timeout on every call, retries only when idempotent, typed errors) + `<backend>-schemas.ts` (Zod of their payloads) + `<backend>-mapper.ts` (pure, fixture-tested) + `<backend>-gateway.ts`. Env vars `<BACKEND>_URL` / `<BACKEND>_API_KEY` in `src/env.ts`. See `docs/architecture/integrations.md`.
- **Events:** enqueue in the outbox through the unit of work (same transaction as the change). Handlers are at-least-once: idempotent by construction. `src/server/events` stays feature-agnostic (generic `DomainEvent`); feature schemas and handlers live in `src/features`. The queue (`queue`) and broker are chosen in `container.ts` only; features never import an adapter. See `docs/architecture/events.md`.

## Work Guidance

## Verification

- `pnpm test` (schema validation tests in `db/*.test.ts`), `pnpm db:generate` produces no diff after committing migrations.

## Child Index

None.
