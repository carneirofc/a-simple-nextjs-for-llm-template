# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Radix Primitives (`radix-ui`) as the base for shared UI components.
- `Label` primitive (`src/components/ui/label.tsx`) built on Radix `Label`.
- `Button` `asChild` prop (Radix `Slot`) to render links or other elements with button styles.
- `cn()` class-merging helper (`clsx` + `tailwind-merge`) in `src/lib/cn.ts`.
- Semantic design tokens (`primary`, `muted-foreground`, `border`, `destructive`, `ring`) in `globals.css`, light + dark.
- Root `error.tsx` (Next 16 `retry`) and `not-found.tsx`.
- Claude Code project setup: `.claude/settings.json` (permissions, Biome PostToolUse hook, cloud SessionStart install) and skills `/new-feature`, `/new-ui-primitive`, `/review-change`.
- GitHub Actions CI (`pnpm check` + migration drift check), PR template, `.editorconfig`, `.nvmrc`.
- `AGENTS.md`: UI & styling, security and agent-loop guidance plus a definition of done.

### Changed
- `TextInput` renders its label via the shared `Label` primitive.
- `src/components/AGENTS.md` / `AGENTS.md`: "Radix first" contract for interactive UI primitives.
- UI primitives merge `className` via `cn()` (callers can override base classes), use design tokens, and show `focus-visible` rings.
- `FieldErrors` de-duplicates messages (fixes duplicate React keys); notes title input sets `aria-invalid`.

### Fixed
- Home page uses `fetchQuery` for SSR so a failed DB read reaches `error.tsx` with its real cause, instead of a misleading "Server Functions cannot be called during initial render" 500.

## [0.2.0] - 2026-09-28

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
