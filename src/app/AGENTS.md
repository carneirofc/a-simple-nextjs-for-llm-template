# src/app

## Purpose

Next.js App Router routes, root layout, global providers and CSS.

## Ownership

- `layout.tsx`, `providers.tsx` (TanStack Query provider + devtools in dev), `globals.css` (Tailwind v4 entry + design tokens), `page.tsx`, `error.tsx`, `not-found.tsx`, `api/**` route handlers.
- Feature UI lives in `src/features/*`; pages compose it.

## Local Contracts

- Server Components by default. `"use client"` only on leaf components that need state/effects/events.
- SSR data pattern: in the page, `await connection()` if it reads the DB, then `getQueryClient()` → `await fetchQuery(<feature>QueryOptions)` (not `prefetchQuery`, which swallows errors) → wrap client tree in `<HydrationBoundary state={dehydrate(queryClient)}>`. Client components read with `useSuspenseQuery` / `useQuery` using the same query options.
- Check feature flags (`isEnabled`) on the server before rendering gated features.
- `api/auth/[...all]/route.ts` returns 404 when auth is disabled; keep it that way.
- Default exports only for Next special files (`page`, `layout`, `loading`, `error`, `not-found`, `template`, `default`).
- Use `LayoutProps<"/route">` / `PageProps<"/route">` globals for typing.
- `error.tsx` is a client component receiving `{ error, retry }` (Next 16: `retry` re-fetches; `reset` only clears state). Show `error.digest`, never `error.message` from the server. Add a segment-level `error.tsx` only when a route needs different recovery UI.

## Work Guidance

## Verification

- `pnpm typecheck` (includes `next typegen` for typed routes), `pnpm build`.

## Child Index

None.
