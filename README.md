# a-simple-nextjs-for-llm-template

Minimal, opinionated Next.js 16 starter built for LLM-assisted development. Rules for agents live in [AGENTS.md](AGENTS.md).

## Quick start

```sh
corepack enable        # or: npm i -g pnpm
pnpm install
cp .env.example .env.local
pnpm dev               # http://localhost:3000 — embedded PGlite DB, no setup
```

## Scripts

| Script | What |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm lint` / `lint:fix` | Biome |
| `pnpm typecheck` | Route typegen + `tsc` |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest |
| `pnpm check` | Everything above |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle Kit |

## Working with AI agents

- [AGENTS.md](AGENTS.md) (plus one per `src/` subtree) holds the rules; `CLAUDE.md` imports it.
- [docs/architecture/](docs/architecture/README.md) explains the design patterns behind them — layering, DI, state, caching, events, multi-backend integration — and when to introduce each.
- `.claude/skills/` — reusable prompts: `/new-feature`, `/new-ui-primitive`, `/review-change`.
- `.claude/settings.json` — pre-approved `pnpm` checks, a Biome hook that lints every edited file, and `pnpm install` on cloud session start.
- CI runs `pnpm check`, commitlint and a migration-drift check on every PR.

## Git hooks

[Lefthook](https://lefthook.dev) (a single native binary — same behaviour on Windows, macOS and Linux, no Bash or Husky shims) is installed by `pnpm install` through the `prepare` script. Config: [lefthook.yml](lefthook.yml).

| Hook | Runs |
| --- | --- |
| `pre-commit` | `biome check --write` on staged files (fixes are re-staged) · `vitest related` for staged `src/` files |
| `commit-msg` | commitlint — Conventional Commits, no `Co-Authored-By` ([commitlint.config.mjs](commitlint.config.mjs)) |
| `pre-push` | `pnpm typecheck` · `pnpm test` |

Skip in an emergency with `git commit --no-verify` or `LEFTHOOK=0`; CI repeats every check, so nothing unchecked lands. Re-install with `pnpm prepare`; personal overrides go in a gitignored `lefthook-local.yml`.

## Internationalisation

URLs are prefixed with a locale (`/en`, `/pt-BR`); `/` redirects using the `NEXT_LOCALE` cookie, then `Accept-Language`. Strings live in typed dictionaries under `src/i18n/dictionaries/` — a missing translation fails `pnpm typecheck`. See [src/i18n/AGENTS.md](src/i18n/AGENTS.md) to add a locale.

## Configuration

See [.env.example](.env.example). Production needs `DATABASE_URL`. Auth is off unless `FEATURE_AUTH=true` with Better Auth + GitHub secrets.

## Branching

git-flow: `master` (releases) · `develop` (integration) · `feature/*` · `release/*` · `hotfix/*`.
