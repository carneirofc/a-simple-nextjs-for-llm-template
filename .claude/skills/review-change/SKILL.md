---
name: review-change
description: Review the current diff (or a named branch/PR) against this repo's AGENTS.md contracts before committing. Use when asked to review, self-check, or confirm a change is ready.
---

# Review change

1. Get the diff: `git diff develop...HEAD` plus `git status` for uncommitted work (or the branch/PR the user named).
2. Read `AGENTS.md` and the child `AGENTS.md` for every directory touched.
3. Run `pnpm check`. Any failure is finding #1.
4. Check every item. Cite `file:line` for each violation and explain the concrete consequence.

**Correctness and security**
- Server actions validate input (Zod) and authorize the caller; nothing trusts client-supplied ids or flags.
- No secrets or `process.env` outside `src/env.ts`; new env vars are in `.env.example`.
- Errors are not swallowed; async calls are awaited or intentionally handled.
- Works with `getAuth()` returning `null`.

**Contracts**
- Data shapes come from Zod / `drizzle-zod`; no duplicated hand-written types.
- DB access only via Drizzle `getDb()`; schema change has a committed migration.
- Server state = TanStack Query; forms = TanStack Form; tables = TanStack Table v9 `useTable`.
- New user-facing behaviour is behind a `FEATURE_*` flag resolved on the server.
- `"use client"` only on interactive leaves; Server Components by default.

**UI**
- Built from `src/components/ui`; interactive primitives wrap Radix.
- No hard-coded user-visible strings; every new key exists in all `src/i18n/dictionaries/*`; dates/numbers formatted with an explicit locale.
- Semantic color tokens only, `cn()` for class merging, visible `focus-visible` styles, labelled inputs.

**Hygiene**
- Colocated tests for new logic, querying by role/label.
- No barrels, kebab-case files, named exports, one component per file.
- No `biome-ignore` without a reason; never for size or complexity rules.
- `CHANGELOG.md` `[Unreleased]` entry; Conventional Commit message.

5. Output: verdict (ready / needs changes), then findings ordered by severity. Do not pad with praise or restate passing items.
