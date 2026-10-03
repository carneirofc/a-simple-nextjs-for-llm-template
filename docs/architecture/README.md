# Architecture

Design patterns and coding principles for code built on this template. `AGENTS.md` holds the short, enforceable rules; these pages explain them and say **when** each pattern applies. Read the page for the topic you are touching before writing code.

| Page | Read when you… |
| --- | --- |
| [principles.md](principles.md) | write any code (layering, errors, boundaries) |
| [dependency-injection.md](dependency-injection.md) | add a service, a port, a backend client, or need to fake something in a test |
| [state-management.md](state-management.md) | decide where a piece of state lives (server, URL, form, client) |
| [caching.md](caching.md) | read data that many requests or clients share, or mutate cached data |
| [events.md](events.md) | trigger side effects, push updates to clients, or receive webhooks |
| [integrations.md](integrations.md) | call another backend, or expose an API to clients other than this UI |

## The shape in one picture

```text
          transports (thin)                       core                       adapters (edges)
┌───────────────────────────────┐   ┌──────────────────────────────┐   ┌────────────────────────────┐
│ Server Components (page.tsx)  │   │ <feature>/data.ts            │   │ Drizzle (getDb)            │
│ Server actions (actions.ts)   │──▶│  authorize → validate (Zod)  │──▶│ integrations/<backend>/*   │
│ Route handlers (api/v1/**)    │   │  → use case → emit events    │   │ outbox, event broker (SSE) │
│ Webhooks (api/webhooks/**)    │   │ ports = types it depends on  │   │ (implement the ports)      │
└───────────────────────────────┘   └──────────────────────────────┘   └────────────────────────────┘
        ▲ client components call actions / route handlers through TanStack Query
```

- **One core, many transports.** The web UI (actions), other clients (versioned route handlers) and webhooks all call the same `data.ts` functions. Authorization and validation live there once.
- **Dependencies point inward.** Transports import the core; the core imports ports (types) and receives adapters through its dependencies; adapters never import transports or UI. Biome's `noRestrictedImports` overrides enforce the folder-level part of this (see below).
- **Edges validate, the core trusts its types.** Every value that crosses a boundary (env, request, action argument, DB JSON column, backend response, webhook, event payload) is parsed with Zod exactly once, at that boundary.

## Reference implementation

`src/features/notes/` is the minimal working example of every pattern marked **In use**; copy its shape:

| Concern | Files |
| --- | --- |
| Use cases (validation, flag, `Result`) | `src/features/notes/data.ts` (+ `data.test.ts` with a fake repository) |
| Port, adapters, contract test | `src/server/notes/notes-ports.ts`, `drizzle-notes-repository.ts`, `fake-notes-repository.ts`, `notes-repository.test.ts` |
| Composition root | `src/server/container.ts` |
| Mutation transport | `src/features/notes/actions.ts` → `Result` → `notes-form.tsx` shows server field errors |
| Read transport for any client | `src/app/api/v1/notes/route.ts` + `notes-api-schemas.ts` (wire contract, Zod codec for dates) + `src/server/http/json-response.ts` (ETag/304, problem+json) |
| Browser cache | `notes-cache.ts` (keys) → `queries.ts` (`fetchNotes` from `notes-api-client.ts`) → `notes-panel.tsx` (invalidate on success) |
| Shared input rules | `notes-schema.ts` (plain Zod; used by the form and the use case) |
| Async processing + realtime | `notes-events.ts` (event schemas + query keys to invalidate), `notes-event-handlers.ts`, `data.ts` (note + `note.created` in one unit of work), `src/server/events/*`, `src/app/_events/*`, `src/instrumentation.ts` |

## Enforced boundaries (`biome.json`)

| Folder | May not import |
| --- | --- |
| `src/components/**` | `@/app`, `@/features`, `@/server`, `@/env` |
| `src/lib/**`, `src/i18n/**` | `@/app`, `@/features`, `@/server` |
| `src/server/**` | `@/app`, `@/features`, `@/components` |

Features may not import other features (not lint-enforced): share through `src/lib`, `src/server`, or an event.

## Adoption status

Patterns are added when the first real need appears, not up front (YAGNI). The trigger column is the need.

| Pattern | Status | Trigger to introduce it |
| --- | --- | --- |
| Data access layer (`data.ts`), Zod at boundaries, derived types | **In use** | — |
| Server state in TanStack Query, forms in TanStack Form | **In use** | — |
| Folder dependency rule (Biome) | **In use** | — |
| Cache contract (`<feature>-cache.ts`) + per-request `QueryClient` | **In use** | — |
| Expected errors as values (`Result`, `src/lib/action-result.ts`) | **In use** | — |
| Function DI: repository port + adapters + composition root (`src/server/container.ts`) | **In use** | — |
| Client reads via `GET /api/v1/<feature>` with ETag + problem+json | **In use** | — |
| URL search params as state | Rule | first filter, sort, page or tab |
| Jotai | Rule | first client state shared by components that are not parent/child |
| Next `"use cache"` + `cacheTag` (`cacheComponents`) | Proposed | first data shared across users that is expensive to read |
| Shared cache handler (Redis) | Proposed | running more than one server instance |
| OpenAPI generated from the API schemas | Rule | first non-browser client |
| Transactional outbox + event processor (retries, dead letter) + `after()` for best effort | **In use** | — |
| SSE invalidation channel (`/api/v1/events` → `RealtimeListener`) | **In use** | — |
| Multi-instance event fan-out (`LISTEN/NOTIFY` broker adapter) | Proposed | running more than one server instance with `FEATURE_REALTIME` |
| pg-boss / workflow engine (Inngest, Trigger.dev) | Proposed | cron schedules, priorities, or durable multi-step workflows |
| Backend gateway (anti-corruption layer) | Rule | first external backend |

"Rule" = the convention is decided; follow it the first time the trigger happens. "Proposed" = needs infrastructure or a dependency; agree on it with the maintainer before adding.
