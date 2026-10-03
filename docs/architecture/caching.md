# Caching

Source: the bundled Next 16 docs (`node_modules/next/dist/docs/01-app/`): `01-getting-started/08-caching.md`, `09-revalidating.md`, `02-guides/how-revalidation-works.md`, `self-hosting.md`, `cdn-caching.md`, `client-side-data-fetching/tanstack-query.md`, `03-api-reference/01-directives/use-cache*.md`. Re-read them before changing cache code; this page records the decisions.

## The layers

| # | Layer | Scope | Controlled by | Invalidated by |
| --- | --- | --- | --- | --- |
| 1 | React `cache()` | one server render | wrapping a function | end of request |
| 2 | Next server cache (`"use cache"`) | all users, one instance (default: in-memory LRU) | `cacheLife`, `cacheTag` | `updateTag`, `revalidateTag` |
| 3 | Shared cache handler (`"use cache: remote"` / `cacheHandlers`) | all users, all instances | `next.config.ts` `cacheHandlers` | same, propagated through the handler |
| 4 | CDN / HTTP caches | all clients behind it | `Cache-Control`, `ETag`, `Vary` | expiry or the CDN purge API (Next does **not** purge it) |
| 5 | Next client router cache | one browser tab | `cacheLife` `stale` (min 30 s) | any `updateTag`/`revalidateTag`/`refresh` in an action clears it all |
| 6 | TanStack Query | one browser tab | `staleTime`, `gcTime` | `queryClient.invalidateQueries` |

Layers 2–4 are **shared**: anything stored there is visible to every user. Layers 1, 5, 6 are private.

## Current state of this template

- `cacheComponents` is **off**; pages that read the DB call `await connection()` and are rendered per request. Only layers 1, 5 and 6 are active. That is correct and safe for a starter.
- Do **not** add `export const dynamic | revalidate | fetchCache` route segment config or `unstable_cache`: they error or are replaced once `cacheComponents` is on. Keep the code forward-compatible.
- Turning on `cacheComponents` is a proposed, separate change (see "Migration" below). Until then, scale reads with TanStack `staleTime`, HTTP headers on route handlers, and DB indexes.

## Decide per read

1. **Personalized or permission-dependent?** Never in layers 2–4 keyed only by input. Either leave it uncached (default), use `"use cache: private"` (browser-only, never stored on the server), or resolve the user *outside* the cache and pass `userId` into an unexported cached function tagged `<entity>:user:<userId>`.
2. **Shared and read-heavy, staleness acceptable?** `"use cache"` + explicit `cacheLife(...)` + `cacheTag(...)` on a `data.ts`-level read function (never on the action or the route handler export).
3. **Expensive and running on more than one instance?** `"use cache: remote"` with a shared handler. Skip it when keys are mostly unique, the read is under ~50 ms, or data changes every few seconds.
4. **Served to non-browser clients?** HTTP caching on the route handler (below), on top of 2/3.

## Rules for cache-friendly code

- **Every cached function sets `cacheLife` explicitly** (the implicit default is stale 5 min / revalidate 15 min / expire never). Call it inline, not through a shared helper.
- **Inputs are the key.** Arguments and captured closure variables form the key; pass only serializable primitives/plain objects. Normalize them first (trim, lowercase, sort filter keys, clamp page size) so equal requests share an entry.
- **Low cardinality.** Cache on the dimension with fewer values (per product, per locale), not per user or per free-text search.
- **No request data inside a cached scope.** `cookies()`, `headers()`, `searchParams`, `connection()` are forbidden there (it can pass `next build` and fail at runtime). Read them outside, pass the values in.
- **No clocks or randomness inside a cached scope**: the value is frozen into the shared entry. Pass `now` in, or keep it outside.
- **Cache DTOs, not rows.** Store the minimal shape the consumer needs; never secrets, tokens or emails, and never in tags/keys (they are stored in plain text).
- **Locale lives in the path** (`/[lang]/…`), so responses never need `Vary: Accept-Language`. Keep it that way; do not branch rendering on headers.
- **Cursor pagination** for lists that change (stable keys; offset pages shift on insert).

## Cache contract per feature

One file, `<feature>/<feature>-cache.ts`, with no server-only or client-only imports, owns every identity for that data so the layers stay coordinated:

```ts
export const notesCache = {
  key: { all: ["notes"] as const, detail: (id: string) => ["notes", id] as const },
  tag: { all: "notes", detail: (id: string) => `notes:${id}` },
};
```

`queries.ts` builds `queryOptions` from `notesCache.key.*`; cached server reads call `cacheTag(notesCache.tag.*)`; mutations invalidate both.

## Invalidation

| Where the write happens | Server cache | Browser cache |
| --- | --- | --- |
| Server action (user must see own write) | `updateTag(tag)` — expires now; next read waits | `invalidateQueries({ queryKey })` in `onSuccess`, or `setQueryData` with the returned DTO |
| Server action (eventual is fine) | `revalidateTag(tag, "max")` — stale-while-revalidate | same |
| Route handler, webhook, worker | `revalidateTag(tag, "max")`, or `{ expire: 0 }` when it must be immediate (`updateTag` throws outside actions) | push an invalidation event ([events.md](events.md)) |

- `revalidateTag` **requires** the second argument in Next 16; the one-argument form is deprecated.
- Prefer tags over `revalidatePath`.
- Without `cacheComponents` there is no server cache entry to invalidate; only the TanStack step applies.

## HTTP caching for route handlers (other clients)

- Public, non-personalized `GET`: `Cache-Control: public, max-age=0, s-maxage=<n>, stale-while-revalidate=<m>` plus a strong `ETag` (hash of the DTO or `updatedAt`); answer `If-None-Match` with `304`.
- Authenticated `GET`: `Cache-Control: private, no-store` (or `private, max-age=<n>` + `ETag` for revalidation). Never `public` on a response that depends on the caller.
- Mutations are never cached; they invalidate (table above) and, behind a CDN, call its purge API.

## Multiple instances (load balancer, several pods)

Defaults are per process, so without this list instances serve different data:

- [ ] `cacheHandlers` (`default` and/or `remote`) backed by shared storage (Redis/Valkey), implementing `updateTags` + `refreshTags` so tag invalidation reaches every instance. `get()` must catch errors and return `undefined`.
- [ ] `deploymentId` set, and every instance runs the same build (it is part of every cache key and protects against version skew).
- [ ] Same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` on all instances (otherwise "Failed to find Server Action").
- [ ] Streaming not buffered by the reverse proxy (`X-Accel-Buffering: no`).
- [ ] Graceful shutdown (SIGTERM drain) so `after()` callbacks finish.
- [ ] All `use cache` entries reset on deploy; warm critical ones if needed.

## Migration to `cacheComponents` (proposed)

Follow `02-guides/migrating-to-cache-components.md`. For this repo specifically: set `cacheComponents: true`; move DB reads below `<Suspense>`; replace page-level `await connection()` with `io()` / Suspense where it only guards current time; build the TanStack hydration state with the guide's prerenderable `dehydrate` helper (plain `dehydrate()` reads the clock during prerender); add the cache contract and `updateTag` to `notes`. Do it as its own change with tests.
