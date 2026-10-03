---
name: new-feature
description: Scaffold a new vertical feature (DB table, server data/actions, query options, client UI, flag, tests) following the notes/ reference module. Use when the user asks to add a feature, page, entity, CRUD screen or data-backed UI.
---

# New feature

Goal: a working, flagged, tested feature that passes `pnpm check` on the first try. Mirror `src/features/notes/` exactly; when in doubt, copy its shape rather than inventing one.

## 0. Read first
- `AGENTS.md`, `src/features/AGENTS.md`, `src/server/AGENTS.md`, `src/app/AGENTS.md`.
- `docs/architecture/README.md` (adoption table) and the page for every pattern the feature needs: external backend → `integrations.md`; shared/expensive reads → `caching.md`; side effects or live updates → `events.md`; filters/sort/paging → `state-management.md`.
- Every file in `src/features/notes/`, `src/server/db/schema/notes.ts`, and `src/i18n/AGENTS.md`.
- For any Next.js API you are unsure of, the matching page in `node_modules/next/dist/docs/` (Next 16 differs from your training data).

## 1. Clarify (only if genuinely ambiguous)
Name (kebab-case `<name>`), fields + validation rules, which route renders it. Otherwise pick sensible defaults and state them.

## 2. Build in this order
1. **Flag** — `FEATURE_<NAME>` in `src/env.ts` (default `false` unless asked), `.env.example`, key in `flagsSchema` + `flags` in `src/lib/flags.ts`, extend `src/lib/flags.test.ts`.
2. **Strings** — add a `<name>` namespace to `src/i18n/dictionaries/en.ts` and every other locale; validation messages are `ValidationKey`s.
3. **Schema** — `src/server/db/schema/<name>.ts`: `pgTable`, `<name>SelectSchema`, `<name>InsertSchema` (plain `drizzle-zod`), `z.infer` types; register in `schema` in `src/server/db/client.ts`. Input rules in `src/features/<name>/<name>-schema.ts` (plain Zod, messages = `ValidationKey`) + `<name>-schema.test.ts`.
4. **Migration** — `pnpm db:generate`; commit the new `drizzle/` files untouched.
5. **Server** — port `src/server/<name>/<name>-ports.ts`, adapters `drizzle-<name>-repository.ts` + `fake-<name>-repository.ts`, contract test `<name>-repository.test.ts`; register the adapter in `src/server/container.ts`. Then `data.ts` (`create<Name>Service(deps)`: flag assert, `safeParse` → `Result`, ports) + `data.test.ts` with the fake, and `actions.ts` (`"use server"`, mutations only, `input: unknown`). Server actions are public endpoints: check auth in `data.ts` when the feature needs it (`getAuth()` may be `null`).
6. **Reads & cache** — `src/app/api/v1/<name>/route.ts` (`GET`, `jsonWithEtag`, `problem`) + `route.test.ts`; `<name>-api-schemas.ts` (wire contract) + `<name>-api-client.ts` (+ test); `<name>-cache.ts` (keys); `queries.ts` (`queryOptions` with the API client as `queryFn`).
6b. **Async work (only if the feature needs it)** — `<name>-events.ts` (event schemas + `defineRealtimeEvents`), enqueue the event in `data.ts` inside `transaction(...)`, `<name>-event-handlers.ts` (idempotent) + test; register both in `src/app/_events/`. See `docs/architecture/events.md`.
7. **UI** — client leaves `<name>-*.tsx` composed from `src/components/ui/*`, strings via `labels` props; forms = TanStack Form + Zod; tables = TanStack Table v9 `useTable`; columns in `<name>-columns.ts`. Tokens only (`bg-primary`, `border-border`, …), `cn()` for class merging.
8. **Page** — `src/app/[lang]/<route>/page.tsx`: `await connection()`, `await getDictionary()`, check `isEnabled`, prefetch with `data.ts` fn, `HydrationBoundary`.
9. **Tests** — colocated, Testing Library + `userEvent`, mock actions via props (resolve to a `Result`); form test for server field errors.
10. **Docs** — `CHANGELOG.md` `## [Unreleased]` entry; update a child `AGENTS.md` only if you introduced a new convention.

## 3. Verify
Run `pnpm check`. If a size/complexity rule fails, split the module (see "Where extracted code goes" in `AGENTS.md`); never add `biome-ignore` for those rules.

## 4. Report
List files created, the flag name, how to enable it, and anything you assumed.
