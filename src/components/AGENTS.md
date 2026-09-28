# src/components

## Purpose

Shared, feature-agnostic presentational UI primitives (`ui/`), styled with Tailwind only.

## Ownership

- `ui/button.tsx`, `ui/text-input.tsx`, `ui/field-errors.tsx`, `ui/data-table.tsx` and their tests.
- Feature-specific UI stays in `src/features/<name>/`.

## Local Contracts

- One component per file, named export, kebab-case filename, colocated `<file>.test.tsx`.
- Props-driven only: no data fetching, no server actions, no `@/server/**` imports, no feature flags.
- Extend native elements via `ComponentProps<"el">` and spread the rest props; merge `className`.
- No `"use client"` unless the component itself uses hooks or browser APIs (consumers add the boundary).
- Promote a component here only once two or more features need it (or it is clearly generic).
- Same size limits as the rest of the repo (file ≤ 150 lines, function ≤ 40); split into more primitives instead.

## Work Guidance

- Prefer composing existing primitives over adding variants; add a variant only when reused.

## Verification

- `pnpm test`, `pnpm lint`.

## Child Index

None.
