# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Live UI updates: in-memory `EventBroker` port, Server-Sent Events at `/api/v1/events` (flag `FEATURE_REALTIME`), `useEventSource` hook and `RealtimeListener` that invalidate TanStack Query keys per event (`defineRealtimeEvents`); creating a note publishes `note.created` so other open tabs refetch. Durable background jobs are documented as an external-service integration, not built in.
- Radix Primitives (`radix-ui`) as the base for shared UI components.
- `Label` primitive (`src/components/ui/label.tsx`) built on Radix `Label`.
- `Button` `asChild` prop (Radix `Slot`) to render links or other elements with button styles.
- `cn()` class-merging helper (`clsx` + `tailwind-merge`) in `src/lib/cn.ts`.
- Semantic design tokens (`primary`, `muted-foreground`, `border`, `destructive`, `ring`) in `globals.css`, light + dark.
- Root `error.tsx` (Next 16 `retry`) and `not-found.tsx`.
- Claude Code project setup: `.claude/settings.json` (permissions, Biome PostToolUse hook, cloud SessionStart install) and skills `/new-feature`, `/new-ui-primitive`, `/review-change`.
- GitHub Actions CI (`pnpm check` + migration drift check), PR template, `.editorconfig`, `.nvmrc`.
- `AGENTS.md`: UI & styling, security and agent-loop guidance plus a definition of done.
- Cross-platform Git hooks via Lefthook (installed by `pnpm install`): pre-commit Biome autofix + related Vitest tests on staged files, commit-msg commitlint (Conventional Commits, no `Co-Authored-By`), pre-push typecheck + tests. CI also lints commit messages.
- Internationalisation (English + Brazilian Portuguese (`pt-BR`)) on Next 16 primitives, no new dependencies: locale-prefixed routes under `src/app/[lang]/`, `src/proxy.ts` redirects via `NEXT_LOCALE` cookie → `Accept-Language`, type-checked dictionaries, `next/root-params` `getDictionary()`, `LocaleSwitcher`, `interpolate()` and `formatDateTime()` helpers, localized 404/error pages and metadata. Rules in `src/i18n/AGENTS.md`.
- `docs/architecture/`: design patterns and coding principles with adoption triggers — layering and principles, function-based IoC/DI with a composition root, state placement (server/URL/form/Jotai), Next 16 caching for multiple clients and instances (`use cache`, tags, cache handlers, HTTP caching), event patterns (`after()`, SSE live updates, webhooks; durable jobs as an external integration), and gateway/anti-corruption-layer integration of multiple backends plus a versioned public API.
- `notes` is now the minimal reference implementation of the architecture patterns: repository port (`src/server/notes/`) with Drizzle and in-memory adapters sharing one contract test (PGlite in memory), composition root `src/server/container.ts`, `createNotesService(deps)` use cases tested with fakes, `GET /api/v1/notes` route handler (explicit wire schema with a Zod date codec, ETag/`304`, problem+json) used by the client query, and a `notes-cache.ts` query-key contract.
- `src/lib/action-result.ts` (`Result` for expected failures: `ok`, `fail`, `validationFailure`, `toFieldErrors`), `src/lib/http-cache.ts` (`createEtag`, `matchesEtag`) and `src/server/http/json-response.ts` (`jsonWithEtag`, `problem`).
- Biome `noRestrictedImports` folder boundaries: `src/components` cannot import app/features/server/env; `src/lib` and `src/i18n` cannot import app/features/server; `src/server` cannot import app/features/components.

### Changed
- `createNote` takes `unknown` input and returns a `Result`; the form shows server-side field errors. The `listNotes` server action is gone: client reads go through `/api/v1/notes` (server actions are queued one at a time).
- Note input rules moved to plain-Zod `src/features/notes/notes-schema.ts` (the client form no longer bundles Drizzle); `noteInsertSchema` is the plain `drizzle-zod` DB shape.
- `getQueryClient()` memoizes the server client per request with React `cache()` (layout and page share one).
- Vitest restores stubbed globals after each test (`unstubGlobals`).
- `AGENTS.md` (root, `src/app`, `src/features`, `src/server`, `src/components`) and the `/new-feature` and `/review-change` skills reference the architecture rules: thin transports over `data.ts`, actions for mutations only, `Result` for expected errors, `<feature>-cache.ts` contracts, no route segment cache config.
- `TextInput` renders its label via the shared `Label` primitive.
- `src/components/AGENTS.md` / `AGENTS.md`: "Radix first" contract for interactive UI primitives.
- UI primitives merge `className` via `cn()` (callers can override base classes), use design tokens, and show `focus-visible` rings.
- `FieldErrors` de-duplicates messages (fixes duplicate React keys) and translates them via an optional `messages` map; notes title input sets `aria-invalid`.
- Zod validation messages are dictionary keys (`ValidationKey`) instead of English text.
- Notes UI takes its strings as `labels` props; `notesColumns` became `createNotesColumns(labels, locale)`; dates are locale-formatted (UTC) instead of ISO strings.

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
