# src/app

## Purpose

Next.js App Router routes, root layout, global providers and CSS. All pages live under `[lang]/` (the root layout is `[lang]/layout.tsx`); `src/proxy.ts` redirects unprefixed URLs.

## Ownership

- `layout.tsx`, `providers.tsx` (TanStack Query provider + devtools in dev), `globals.css` (Tailwind v4 entry + design tokens), `[lang]/layout.tsx`, `[lang]/page.tsx`, `[lang]/error.tsx`, `[lang]/not-found.tsx`, `[lang]/[...missing]/page.tsx` (routes unmatched URLs to the localized 404), `api/**` route handlers (not localized; excluded from the proxy).
- Feature UI lives in `src/features/*`; pages compose it.

## Local Contracts

- Server Components by default. `"use client"` only on leaf components that need state/effects/events.
- SSR data pattern: in the page, `await connection()` if it reads the DB, then `getQueryClient()` → `await fetchQuery(<feature>QueryOptions)` (not `prefetchQuery`, which swallows errors) → wrap client tree in `<HydrationBoundary state={dehydrate(queryClient)}>`. Client components read with `useSuspenseQuery` / `useQuery` using the same query options.
- Check feature flags (`isEnabled`) on the server before rendering gated features.
- `api/auth/[...all]/route.ts` returns 404 when auth is disabled; keep it that way.
- Route handlers for other clients live in `api/v1/<resource>/route.ts`; webhooks in `api/webhooks/<provider>/route.ts`. Both are thin: parse with Zod, resolve the caller, call the feature's `data.ts`, map `Result` codes to `application/problem+json`. Set `Cache-Control` deliberately (`private, no-store` for anything per-user). See `docs/architecture/integrations.md`.
- Don't fetch your own route handlers from Server Components; call `data.ts` directly.
- `_events/` (private folder, not a route): `event-handlers.ts` (merges feature handlers into the processor), `realtime-events.ts` (public event matchers + `REALTIME_EVENTS_PATH`), `realtime-listener.tsx` (SSE → `invalidateQueries`, mounted in `[lang]/layout.tsx` when `realtime` is on), `jobs-runner.ts` (inline poller started by `src/instrumentation.ts`). New features register their handlers and realtime events here.
- `api/v1/jobs/[id]` returns a job's status/progress/result (never its payload); `api/v1/events` is the SSE stream (flag `realtime`); `api/internal/jobs` drains the outbox for `JOBS_RUNNER=external` (Bearer `JOBS_SECRET`, 404 when unset).
- Don't export `dynamic`, `revalidate` or `fetchCache` segment config (incompatible with `cacheComponents`); see `docs/architecture/caching.md`.
- Each independently slow section (e.g. a different backend) gets its own async Server Component inside `<Suspense>` so the page streams.
- Default exports only for Next special files (`page`, `layout`, `loading`, `error`, `not-found`, `template`, `default`).
- New pages go in `[lang]/<route>/page.tsx`; read strings with `await getDictionary()` and pass slices to client components. Links: `` `/${locale}/route` ``.
- Use `LayoutProps<"/route">` / `PageProps<"/route">` globals for typing.
- `error.tsx` is a client component receiving `{ error, retry }` (Next 16: `retry` re-fetches; `reset` only clears state). Show `error.digest`, never `error.message` from the server. Add a segment-level `error.tsx` only when a route needs different recovery UI.

## Work Guidance

## Verification

- `pnpm typecheck` (includes `next typegen` for typed routes), `pnpm build`.

## Child Index

None.
