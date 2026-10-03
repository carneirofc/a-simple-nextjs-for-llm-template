# src/features

## Purpose

Vertical feature modules. `notes/` is the reference example (SSR prefetch → hydration → TanStack Form → server action returning a `Result` → invalidate → client read via `GET /api/v1/notes` → TanStack Table; use cases over a repository port), gated by `FEATURE_NOTES_EXAMPLE`.

## Ownership

Each `src/features/<name>/` owns its UI, use cases, server actions, input/API schemas and query options. DB tables stay in `src/server/db/schema/`; repository ports and adapters in `src/server/<name>/`.

## Local Contracts

- `data.ts` — `"server-only"` use cases: `create<Name>Service(deps)` (deps = `Pick<Container, …>`) checks the feature flag, authorizes, `safeParse`s untrusted input with `<name>-schema.ts` (failure ⇒ `validationFailure(error)`), and calls ports; `get<Name>Service()` builds it from `getContainer()`; plus a plain `get<Name>s()` for Server Component prefetch. Never touches `getDb()` directly. Tested in `data.test.ts` with the fake repository.
- `actions.ts` — `"use server"`; thin async wrappers over `data.ts` for client **mutations**. They are public endpoints: all validation and authorization lives in `data.ts`. Never invoke during render (Next throws) — server prefetch uses `data.ts`. Return a `Result` for failures the user can fix; throw for bugs.
- Mutations update the browser cache (`setQueryData` with the returned DTO or `invalidateQueries` by key prefix; optimistic via `onMutate`/`onError`) and, once server caching is on, the server cache (`updateTag`).
- Features never import other features; share through `src/lib`, `src/server`, or events.
- `queries.ts` — `queryOptions(...)` built from the keys in `<name>-cache.ts`; client `queryFn` = `fetch<Name>s` from `<name>-api-client.ts` (a `GET /api/v1/<name>` route handler: server actions are queued one at a time, so never read through them). Server prefetch spreads it and overrides `queryFn` with the `data.ts` function.
- `<name>-cache.ts` — the cache contract: hierarchical query keys (and server cache tags once `cacheComponents` is on), no server-only or client-only imports. See `docs/architecture/caching.md`.
- `<name>-schema.ts` — plain-Zod input rules (`ValidationKey` messages) shared by the form and `data.ts`; keeps Drizzle out of the client bundle. Tested in `<name>-schema.test.ts`.
- `<name>-api-schemas.ts` — explicit wire contract of `/api/v1/<name>` (not row schemas); dates via `z.codec` (ISO string ↔ `Date`), `z.encode` on the server, `parse` on the client. `<name>-api-client.ts` — browser `fetch` + parse.
- `<name>-*.tsx` — client components; strings arrive as `labels: Dictionary["<name>"][...]` props from the page (see `src/i18n/AGENTS.md`); data via TanStack Query, forms via TanStack Form (`validators` = Zod schema), tables via TanStack Table v9.
- `<name>-columns.ts` / `<name>-config.ts` — table column defs and static config, kept out of component files. Localized columns are a factory (`create<Name>Columns(labels, locale)`) memoized in the table component.
- `use-<name>.ts` — custom hooks extracted from components when stateful logic grows.
- Compose `src/components/ui` primitives (`Button`, `TextInput`, `FieldErrors`, `DataTable`); split a component into sibling `<name>-<part>.tsx` files before it nears the 40-line function limit.
- Colocated tests `<file>.test.tsx` using Testing Library + `userEvent`; test components through props (mock actions/callbacks resolving to a `Result`), not the DB. Use cases: fakes through `deps`. Files that read `@/env` (flags) need `// @vitest-environment node`.
- No `index.ts` barrels; import files directly.

## Work Guidance

- Use the `/new-feature` skill (`.claude/skills/new-feature/SKILL.md`) as the step-by-step checklist.
- Copy `notes/` as the template for a new feature; delete `notes/` (and its flag, schema, migration) when no longer useful.

## Verification

- `pnpm test`, `pnpm lint`.

## Child Index

None.
