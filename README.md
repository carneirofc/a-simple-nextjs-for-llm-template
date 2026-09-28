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

## Configuration

See [.env.example](.env.example). Production needs `DATABASE_URL`. Auth is off unless `FEATURE_AUTH=true` with Better Auth + GitHub secrets.

## Branching

git-flow: `master` (releases) · `develop` (integration) · `feature/*` · `release/*` · `hotfix/*`.
