# src/features

## Purpose

Vertical feature modules. `notes/` is the reference example (SSR prefetch → hydration → TanStack Form → server action → TanStack Table), gated by `FEATURE_NOTES_EXAMPLE`.

## Ownership

Each `src/features/<name>/` owns its UI, server actions and query options. Data schemas stay in `src/server/db/schema/`.

## Local Contracts

- `data.ts` — `"server-only"` data access: check the feature flag, validate input with the Drizzle-derived Zod insert schema, use `getDb()`. Server Components call this directly.
- `actions.ts` — `"use server"`; thin async wrappers over `data.ts` for client calls. Never invoke during render (Next throws) — server prefetch uses `data.ts`.
- `queries.ts` — query keys + `queryOptions(...)` (client `queryFn` = server action). Server prefetch spreads it and overrides `queryFn` with the `data.ts` function.
- `<name>-*.tsx` — client components; data via TanStack Query, forms via TanStack Form (`validators` = Zod schema), tables via TanStack Table v9.
- `<name>-columns.ts` / `<name>-config.ts` — table column defs and static config, kept out of component files.
- `use-<name>.ts` — custom hooks extracted from components when stateful logic grows.
- Compose `src/components/ui` primitives (`Button`, `TextInput`, `FieldErrors`, `DataTable`); split a component into sibling `<name>-<part>.tsx` files before it nears the 40-line function limit.
- Colocated tests `<file>.test.tsx` using Testing Library + `userEvent`; test components through props (mock actions/callbacks), not the DB.
- No `index.ts` barrels; import files directly.

## Work Guidance

- Copy `notes/` as the template for a new feature; delete `notes/` (and its flag, schema, migration) when no longer useful.

## Verification

- `pnpm test`, `pnpm lint`.

## Child Index

None.
