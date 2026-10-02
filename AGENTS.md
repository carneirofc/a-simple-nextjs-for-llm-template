# AGENTS.md

## Purpose

Minimal Next.js 16 starter meant to be extended by LLM agents. Opinionated stack, strict lint, few files.

Stack: Next.js 16 (App Router, `src/`, Turbopack, SSR) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Radix Primitives (`radix-ui`) · Biome v2 · TanStack Query / Form / Table · Zod v4 · Drizzle ORM (Postgres; PGlite in dev) · Better Auth (opt-in) · i18n via Next `[lang]` routing + typed dictionaries · Vitest + Testing Library · pnpm.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Ownership

- Root owns: repo-wide rules, tooling config (`biome.json`, `tsconfig.json`, `next.config.ts`, `drizzle.config.ts`, `vitest.config.mts`, `.env.example`), git workflow, `CHANGELOG.md`.
- Child docs own their subtree (see Child Index).

## Local Contracts

### Hard rules
- **Types derive from Zod.** Data shapes are Zod schemas; types are `z.infer<typeof schema>`. DB shapes come from Drizzle tables via `drizzle-zod` (`createSelectSchema` / `createInsertSchema`). No hand-written `type`/`interface` that duplicates a data shape. Component prop types are fine.
- **ORM only.** All DB access goes through Drizzle via `getDb()` in `src/server/**` or server actions. No raw SQL strings, no other DB clients. Schema changes = edit `src/server/db/schema/*` → `pnpm db:generate` → commit `drizzle/`.
- **State:** server state ⇒ TanStack Query. If a client state library is needed ⇒ **Jotai only** (not installed yet; add `jotai` when first needed). No Redux/Zustand/Context-as-store.
- **Forms ⇒ TanStack Form** (validators = Zod schemas). **Tables ⇒ TanStack Table v9** (`useTable` + `tableFeatures`, not v8 `useReactTable`). **Styles ⇒ Tailwind only.** **Base UI primitives ⇒ Radix (`radix-ui`)**, wrapped in `src/components/ui` (see `src/components/AGENTS.md`).
- **Env** only via `src/env.ts` (`noProcessEnv` enforced). Add every new variable there and to `.env.example`.
- **Feature toggles:** new user-facing features ship behind a flag in `src/lib/flags.ts` (+ `FEATURE_*` in `src/env.ts`). Resolve flags on the server, pass values to client components as props. Remove flag + dead branch once stable.
- **i18n:** no hard-coded user-visible strings; every string is a dictionary key in `src/i18n/dictionaries/*` (all locales in the same change). Routes live under `src/app/[lang]/`. See `src/i18n/AGENTS.md`. (i18n is routing infrastructure, so it is not behind a feature flag.)
- **Auth is opt-in:** `FEATURE_AUTH=true` plus secrets. Code must work with `getAuth()` returning `null`.
- **Lint is law:** `pnpm lint` must pass. `biome-ignore` only with a written reason. Do not weaken `biome.json` rules to make code pass.
- **Tests:** every new module with logic gets a colocated `*.test.ts(x)`. Keep tests out of `src/server/db/schema/` (drizzle-kit loads every file there).
- No barrel files (`index.ts` re-exports). kebab-case filenames. Named exports except Next.js special files and configs.

### Size & structure (Biome-enforced)
- File ≤ 150 lines (tests ≤ 300), function/component ≤ 40 lines (blank lines not counted), ≤ 3 params, cognitive complexity ≤ 10.
- Hitting a limit means **split the module**, never `biome-ignore` a size or complexity rule.
- One exported component per file; never define a component inside another component.
- Where extracted code goes:
  - generic presentational piece → `src/components/ui/<name>.tsx`; feature-specific piece → sibling `<feature>-<part>.tsx`
  - stateful logic → `use-<name>.ts` hook next to its consumer
  - pure logic → `src/lib/<name>.ts` (shared) or `<feature>-<name>.ts` (local), with tests
  - column defs / static config → `<feature>-columns.ts` / `<feature>-config.ts`
- Server Components by default; `"use client"` only on interactive leaves.
- Build UI from `src/components/ui` primitives before writing raw styled elements.

### UI & styling
- Colors come from semantic tokens in `src/app/globals.css` (`bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, `text-destructive`, …). No raw palette classes (`zinc-300`, `red-600`); add a token (light + dark) instead.
- Merge classes with `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge), never string templates, so a caller's `className` overrides defaults.
- Every focusable element has a visible `focus-visible:` style; every input has a label; invalid fields set `aria-invalid`.

### Security
- Server actions (`"use server"`) are public HTTP endpoints. Validate every argument with Zod and authorize the caller inside `data.ts`; never trust ids, roles or flags sent by the client.
- Never log or return secrets; error UI shows `error.digest`, not server messages.

### Git workflow (git-flow)
- `master`: production; only merges from `release/*` / `hotfix/*`, tagged `vX.Y.Z`.
- `develop`: integration; default base for work.
- `feature/<slug>`: from `develop`, merge back to `develop`.
- `release/<x.y.z>`: from `develop`; bump version + finalize `CHANGELOG.md`; merge to `master` (tag) and back to `develop`.
- `hotfix/<slug>`: from `master`; merge to `master` (tag) and `develop`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). No `Co-Authored-By` trailers.
- Every change adds an entry under `## [Unreleased]` in `CHANGELOG.md`.

## Work Guidance

- Agent loop for any change:
  1. Read this file and the child `AGENTS.md` of every directory you will touch; read `node_modules/next/dist/docs/` for any Next API you are not certain of.
  2. Find the closest existing example (`src/features/notes/`, `src/components/ui/button.tsx`) and copy its shape.
  3. Make the smallest change that satisfies the request; write or update its test alongside it.
  4. Run `pnpm check`; fix root causes, don't suppress rules.
  5. Add the `CHANGELOG.md` entry; update an `AGENTS.md` only when a convention changed.
- Claude Code skills in `.claude/skills/` (also invocable as `/new-feature`, `/new-ui-primitive`, `/review-change`) encode these workflows; other agents can read them as plain Markdown checklists.
- `.claude/settings.json` runs Biome on every edited file (`.claude/hooks/biome-check.mjs`) and reports remaining violations immediately.

- Commands (pnpm via `corepack pnpm` if not installed globally):
  - `pnpm dev` — dev server (PGlite at `./.data/pglite`, auto-migrated)
  - `pnpm lint` / `pnpm lint:fix` — Biome check / autofix
  - `pnpm typecheck` — `next typegen` + `tsc --noEmit`
  - `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` — Vitest
  - `pnpm check` — lint + typecheck + test + build
  - `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` — drizzle-kit (stop `pnpm dev` first when using PGlite; single-process DB)
- Layout: `src/app/[lang]` localized routes · `src/proxy.ts` locale redirects · `src/i18n` locales + dictionaries · `src/features/<name>` feature UI + server actions + query options · `src/components/ui` shared presentational primitives · `src/lib` shared client/server utils · `src/server` server-only code · `src/test` test setup.

## Verification

- `pnpm check` (lint, typecheck, unit tests, production build) must pass before commit.
- CI (`.github/workflows/ci.yml`) runs `pnpm check` and fails if `pnpm db:generate` would produce a new migration.

### Definition of done
- [ ] `pnpm check` green; no new `biome-ignore` without a reason
- [ ] Tests cover new logic and the user-visible behaviour
- [ ] New UI strings exist in every dictionary; no hard-coded copy
- [ ] Feature flag, env vars (`src/env.ts` + `.env.example`) and migration added where applicable
- [ ] `CHANGELOG.md` `[Unreleased]` entry; Conventional Commit message

## Child Index

- `src/app/AGENTS.md` — routing, RSC/client boundaries, SSR prefetch + hydration pattern.
- `src/server/AGENTS.md` — database client, schema/migrations, auth.
- `src/components/AGENTS.md` — shared UI primitives contract.
- `src/features/AGENTS.md` — feature module shape (actions, query options, components, tests).
- `src/i18n/AGENTS.md` — locales, dictionaries, translation and formatting rules.
