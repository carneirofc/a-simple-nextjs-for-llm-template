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
│ Route handlers (api/v1/**)    │   │  → use case → emit events    │   │ cache handler, event bus   │
│ Webhooks (api/webhooks/**)    │   │ ports = types it depends on  │   │ (implement the ports)      │
└───────────────────────────────┘   └──────────────────────────────┘   └────────────────────────────┘
        ▲ client components call actions / route handlers through TanStack Query
```

- **One core, many transports.** The web UI (actions), other clients (versioned route handlers) and webhooks all call the same `data.ts` functions. Authorization and validation live there once.
- **Dependencies point inward.** Transports import the core; the core imports ports (types) and receives adapters through its dependencies; adapters never import transports or UI. Biome's `noRestrictedImports` overrides enforce the folder-level part of this (see below).
- **Edges validate, the core trusts its types.** Every value that crosses a boundary (env, request, action argument, DB JSON column, backend response, webhook, event payload) is parsed with Zod exactly once, at that boundary.

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
| Query-key factory + per-request `QueryClient` | Rule | next feature with more than one query |
| Expected errors as values (`Result`) | Rule | first action whose failure the user can fix |
| Function DI + composition root (`src/server/container.ts`) | Rule | first port with two implementations, or first external backend |
| URL search params as state | Rule | first filter, sort, page or tab |
| Jotai | Rule | first client state shared by components that are not parent/child |
| Next `"use cache"` + `cacheTag` (`cacheComponents`) | Proposed | first data shared across users that is expensive to read |
| Shared cache handler (Redis) | Proposed | running more than one server instance |
| Versioned public API (`/api/v1`) + OpenAPI | Rule | first non-browser client |
| In-process domain events + `after()` | Rule | first side effect that is not the use case itself |
| Transactional outbox + worker | Proposed | first side effect that must survive a crash, or cross-service event |
| SSE invalidation channel | Proposed | first screen that must update when another user writes |
| Backend gateway (anti-corruption layer) | Rule | first external backend |

"Rule" = the convention is decided; follow it the first time the trigger happens. "Proposed" = needs infrastructure or a dependency; agree on it with the maintainer before adding.
