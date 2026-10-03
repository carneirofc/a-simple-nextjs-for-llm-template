# src/features

## Purpose

Vertical feature modules. `notes/` is the reference example (SSR prefetch → hydration → TanStack Form → server action → TanStack Table), gated by `FEATURE_NOTES_EXAMPLE`.

## Ownership

Each `src/features/<name>/` owns its UI, server actions and query options. Data schemas stay in `src/server/db/schema/`.

## Local Contracts

- `data.ts` — `"server-only"` data access / use cases: check the feature flag, authorize, validate input with the Drizzle-derived Zod insert schema, use `getDb()` (or ports from `getContainer()` once the feature has an external dependency). Returns DTOs, not rows with fields the caller must not see. Server Components call this directly; actions and route handlers wrap it.
- `actions.ts` — `"use server"`; thin async wrappers over `data.ts` for client **mutations**. They are public endpoints: all validation and authorization lives in `data.ts`. Never invoke during render (Next throws) — server prefetch uses `data.ts`. Return a `Result` for failures the user can fix; throw for bugs.
- Mutations update the browser cache (`setQueryData` with the returned DTO or `invalidateQueries` by key prefix; optimistic via `onMutate`/`onError`) and, once server caching is on, the server cache (`updateTag`).
- Features never import other features; share through `src/lib`, `src/server`, or events.
- `queries.ts` — `queryOptions(...)` built from the keys in `<name>-cache.ts`. Server prefetch spreads it and overrides `queryFn` with the `data.ts` function. Client `queryFn`: a `GET /api/v1/<name>` route handler for new features (server actions are queued one at a time; `notes` uses an action only as a minimal demo).
- `<name>-cache.ts` — the cache contract: hierarchical query-key factory + cache-tag factory, no server-only or client-only imports. Add it with the feature's second query or first server cache. See `docs/architecture/caching.md`.
- `<name>-schema.ts` — plain-Zod input schemas shared by a client form and the server (keeps Drizzle out of the client bundle); the DB insert schema refines it.
- `<name>-api-schemas.ts` — explicit request/response schemas when the feature is exposed under `/api/v1` (not row schemas).
- `<name>-*.tsx` — client components; strings arrive as `labels: Dictionary["<name>"][...]` props from the page (see `src/i18n/AGENTS.md`); data via TanStack Query, forms via TanStack Form (`validators` = Zod schema), tables via TanStack Table v9.
- `<name>-columns.ts` / `<name>-config.ts` — table column defs and static config, kept out of component files. Localized columns are a factory (`create<Name>Columns(labels, locale)`) memoized in the table component.
- `use-<name>.ts` — custom hooks extracted from components when stateful logic grows.
- Compose `src/components/ui` primitives (`Button`, `TextInput`, `FieldErrors`, `DataTable`); split a component into sibling `<name>-<part>.tsx` files before it nears the 40-line function limit.
- Colocated tests `<file>.test.tsx` using Testing Library + `userEvent`; test components through props (mock actions/callbacks), not the DB.
- No `index.ts` barrels; import files directly.

## Work Guidance

- Use the `/new-feature` skill (`.claude/skills/new-feature/SKILL.md`) as the step-by-step checklist.
- Copy `notes/` as the template for a new feature; delete `notes/` (and its flag, schema, migration) when no longer useful.

## Verification

- `pnpm test`, `pnpm lint`.

## Child Index

None.
