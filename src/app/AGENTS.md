# src/app

## Purpose

Next.js App Router routes, root layout, global providers and CSS.

## Ownership

- `layout.tsx`, `providers.tsx` (TanStack Query provider + devtools in dev), `globals.css` (Tailwind v4 entry), `page.tsx`, `api/**` route handlers.
- Feature UI lives in `src/features/*`; pages compose it.

## Local Contracts

- Server Components by default. `"use client"` only on leaf components that need state/effects/events.
- SSR data pattern: in the page, `await connection()` if it reads the DB, then `getQueryClient()` → `prefetchQuery(<feature>QueryOptions)` → wrap client tree in `<HydrationBoundary state={dehydrate(queryClient)}>`. Client components read with `useSuspenseQuery` / `useQuery` using the same query options.
- Check feature flags (`isEnabled`) on the server before rendering gated features.
- `api/auth/[...all]/route.ts` returns 404 when auth is disabled; keep it that way.
- Default exports only for Next special files (`page`, `layout`, `loading`, `error`, `not-found`, `template`, `default`).
- Use `LayoutProps<"/route">` / `PageProps<"/route">` globals for typing.

## Work Guidance

## Verification

- `pnpm typecheck` (includes `next typegen` for typed routes), `pnpm build`.

## Child Index

None.
