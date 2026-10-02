---
name: new-feature
description: Scaffold a new vertical feature (DB table, server data/actions, query options, client UI, flag, tests) following the notes/ reference module. Use when the user asks to add a feature, page, entity, CRUD screen or data-backed UI.
---

# New feature

Goal: a working, flagged, tested feature that passes `pnpm check` on the first try. Mirror `src/features/notes/` exactly; when in doubt, copy its shape rather than inventing one.

## 0. Read first
- `AGENTS.md`, `src/features/AGENTS.md`, `src/server/AGENTS.md`, `src/app/AGENTS.md`.
- Every file in `src/features/notes/`, `src/server/db/schema/notes.ts`, and `src/i18n/AGENTS.md`.
- For any Next.js API you are unsure of, the matching page in `node_modules/next/dist/docs/` (Next 16 differs from your training data).

## 1. Clarify (only if genuinely ambiguous)
Name (kebab-case `<name>`), fields + validation rules, which route renders it. Otherwise pick sensible defaults and state them.

## 2. Build in this order
1. **Flag** — `FEATURE_<NAME>` in `src/env.ts` (default `false` unless asked), `.env.example`, key in `flagsSchema` + `flags` in `src/lib/flags.ts`, extend `src/lib/flags.test.ts`.
2. **Strings** — add a `<name>` namespace to `src/i18n/dictionaries/en.ts` and every other locale; validation messages are `ValidationKey`s.
3. **Schema** — `src/server/db/schema/<name>.ts`: `pgTable`, `<name>SelectSchema`, refined `<name>InsertSchema` (Zod messages = `ValidationKey`), `z.infer` types. Register in `schema` in `src/server/db/client.ts`. Test at `src/server/db/<name>-schema.test.ts` (never inside `schema/`).
4. **Migration** — `pnpm db:generate`; commit the new `drizzle/` files untouched.
5. **Server** — `data.ts` (`server-only`, flag assert, Zod parse, `getDb()`), `actions.ts` (`"use server"`, thin wrappers). Server actions are public endpoints: validate input in `data.ts` and check auth there when the feature needs it (`getAuth()` may be `null`).
6. **Queries** — `queries.ts` with `<name>QueryKey` + `queryOptions`.
7. **UI** — client leaves `<name>-*.tsx` composed from `src/components/ui/*`, strings via `labels` props; forms = TanStack Form + Zod; tables = TanStack Table v9 `useTable`; columns in `<name>-columns.ts`. Tokens only (`bg-primary`, `border-border`, …), `cn()` for class merging.
8. **Page** — `src/app/[lang]/<route>/page.tsx`: `await connection()`, `await getDictionary()`, check `isEnabled`, prefetch with `data.ts` fn, `HydrationBoundary`.
9. **Tests** — colocated, Testing Library + `userEvent`, mock actions via props.
10. **Docs** — `CHANGELOG.md` `## [Unreleased]` entry; update a child `AGENTS.md` only if you introduced a new convention.

## 3. Verify
Run `pnpm check`. If a size/complexity rule fails, split the module (see "Where extracted code goes" in `AGENTS.md`); never add `biome-ignore` for those rules.

## 4. Report
List files created, the flag name, how to enable it, and anything you assumed.
