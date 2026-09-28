# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Biome size/structure rules: file ≤ 150 lines (tests ≤ 300), function ≤ 40 lines, ≤ 3 params, no nested component definitions, no leaked renders.
- Shared UI primitives in `src/components/ui` (`Button`, `TextInput`, `FieldErrors`, `DataTable`) with tests.
- `src/components/AGENTS.md` and "Size & structure" rules in `AGENTS.md` for splitting code into modules.

### Changed
- `notes` example composes the shared UI primitives; table columns moved to `notes-columns.ts`.

## [0.1.0] - 2026-09-28

### Added
- Next.js 16 App Router scaffold (`src/`, Turbopack, SSR) with Tailwind CSS v4.
- Biome v2 with aggressive lint rules (no ESLint/Prettier).
- TanStack Query (SSR prefetch + hydration), TanStack Form, TanStack Table v9.
- Drizzle ORM on Postgres; embedded PGlite in development with auto-migrations; Zod schemas derived via `drizzle-zod`.
- Typed env via `@t3-oss/env-nextjs`; env-driven feature toggles (`FEATURE_*`).
- Opt-in Better Auth (GitHub provider) behind `FEATURE_AUTH`.
- Vitest + Testing Library unit test setup.
- `notes` example feature.
- AGENTS.md hierarchy with project rules and git-flow workflow.
