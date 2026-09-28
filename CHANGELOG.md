# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

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
