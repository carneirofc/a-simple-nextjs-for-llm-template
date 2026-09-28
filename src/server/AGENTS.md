# src/server

## Purpose

Server-only code: database access and authentication. Every module imports `"server-only"`.

## Ownership

- `db/client.ts` — `getDb()` lazy singleton; exports `schema` and `Database` type.
- `db/schema/*.ts` — Drizzle `pgTable` definitions + derived Zod schemas + `z.infer` types. One file per domain.
- `auth.ts` — Better Auth instance via `getAuth()`.
- `../../drizzle/` — generated SQL migrations (commit them, never edit by hand).

## Local Contracts

- **DB driver selection:** `DATABASE_URL` set ⇒ `postgres` (postgres-js). Unset ⇒ PGlite (dev/test only) at `./.data/pglite`, migrations applied automatically on first `getDb()`. Production without `DATABASE_URL` throws on first use.
- Importing `db/client.ts` must never connect; connect only inside `getDb()` (keeps `next build` DB-free).
- Single Postgres dialect everywhere; never add `sqliteTable`/other dialects.
- Column names are camelCase in TS, snake_case in SQL (`casing: "snake_case"` in drizzle config and client); don't pass explicit column-name strings.
- Each table file exports `<name>SelectSchema`, `<name>InsertSchema` (refined for validation) and `type X = z.infer<...>`. Other layers import these; never redeclare shapes.
- New schema file ⇒ add it to the `schema` object in `db/client.ts`.
- Migrations: `pnpm db:generate` after schema edits; prod applies with `pnpm db:migrate` (with `DATABASE_URL`).
- **Auth:** `getAuth()` returns `null` unless `FEATURE_AUTH=true`; env validation requires `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` in that case. Auth tables in `db/schema/auth.ts` must match Better Auth's model names (`user`, `session`, `account`, `verification`); update them when adding Better Auth plugins that extend the schema.

## Work Guidance

## Verification

- `pnpm test` (schema validation tests in `db/*.test.ts`), `pnpm db:generate` produces no diff after committing migrations.

## Child Index

None.
