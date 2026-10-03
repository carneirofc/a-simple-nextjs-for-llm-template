# State management and shared data

## Where state lives

Pick the first row that matches. Storing the same fact in two places is a bug waiting to happen.

| Kind of state | Lives in | Notes |
| --- | --- | --- |
| Data owned by the server (DB, backends) | **Server**: Server Components read it; **browser**: TanStack Query | Never copy query data into `useState`, Jotai or context |
| Shareable view state: filters, sort, page/cursor, selected tab, search text | **URL search params** | Survives reload, shareable, SSR-able, and makes a natural cache key |
| In-progress form input | **TanStack Form** | Validators are the Zod schemas |
| Ephemeral UI of one component (open, hover, step) | `useState` / `useReducer` | |
| Client state shared by components that are not parent/child | **Jotai** atoms (add `jotai` when first needed) | Atoms in `<feature>-atoms.ts`; no server data in atoms |
| Preference the server must know at render (locale, theme) | **Cookie** read on the server | Like `NEXT_LOCALE` in `src/proxy.ts` |
| Preference only the browser needs | `localStorage` behind a small hook | Read after mount to avoid hydration mismatch |
| Derived values | **Computed** during render (`useMemo` only if measured slow) | Never stored |

Not allowed: Redux, Zustand, React Context as a store (Context is fine for injecting a stable value such as a `QueryClient`).

## Server state with TanStack Query

- **Query-key factory** per feature in the cache contract (`<feature>-cache.ts`, see [caching.md](caching.md)), hierarchical so prefix invalidation works: `["notes"]` ⊃ `["notes", "list", filters]` ⊃ `["notes", "detail", id]`. Never inline key arrays in components.
- **`queryOptions` objects** in `queries.ts` are the single definition used by `useQuery`/`useSuspenseQuery`, server prefetch, and invalidation.
- **Reads from the client go through `GET` route handlers, not server actions.** Server actions are queued one at a time per client and are meant for mutations (`02-guides/server-actions.md`, `backend-for-frontend.md`). The `notes` example's `listNotes` action as `queryFn` is acceptable for a demo with one query; new features with client-side reads (polling, refetch on focus, several queries on a screen) expose `GET /api/v1/<feature>` and use `fetch` in the `queryFn`.
- **Per-request `QueryClient` on the server**: wrap the server branch of `getQueryClient()` in React `cache()` so a layout and page in the same render share one client (TanStack and Next docs: one client per server render, a singleton in the browser).
- **Mutations**: `useMutation` → server action → on success, either `setQueryData` with the returned DTO (no extra round trip) or `invalidateQueries` by key prefix. For instant UI, optimistic update in `onMutate`, roll back in `onError`, invalidate in `onSettled`. React 19 `useOptimistic` is fine for form-local optimistic UI.
- **Defaults**: global `staleTime` 60 s (set in `src/lib/query-client.ts`); override per query from the data's real volatility, not per component.
- **Parallel reads**: independent `useSuspenseQuery` calls in one component run sequentially; put them in sibling components or use `useSuspenseQueries`.

## Action results

Server actions used by forms return a `Result` instead of throwing for expected failures (see [principles.md](principles.md)):

```ts
export const actionErrorSchema = z.object({
  code: z.enum(["validation", "notFound", "conflict", "forbidden", "rateLimited"]),
  fields: z.record(z.string(), z.array(z.string())).optional(), // ValidationKey per field
});
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: z.infer<typeof actionErrorSchema> };
```

Put the generic helper in `src/lib/action-result.ts` (with tests) when the first action needs it. The client maps `error.code` and `fields` to dictionary keys; `mutationFn` throws on `ok: false` only if you want TanStack's `onError` path.

## Shared data between server and client

- **Schemas are the contract.** A Zod schema used by both a client form and the server must be importable without pulling Drizzle or `server-only` code into the client bundle. Today `notes-form.tsx` imports `noteInsertSchema` from `src/server/db/schema/notes.ts`; that works because table files have no `server-only` imports, but it ships `drizzle-orm` table code to the browser. For new features with client forms, put the input schema in `<feature>/<feature>-schema.ts` (plain Zod) and refine the `drizzle-zod` insert schema from it on the server.
- **Pass DTOs, not rows**, across the RSC → client boundary. Everything passed as a prop is serialized into the HTML; never pass objects that contain fields the user must not see.
- **Hydration, not double-fetch**: Server Components prefetch with the `data.ts` function under the same query key, then `HydrationBoundary` hands the cache to the client (see `src/app/AGENTS.md`).
- **Dates** cross the boundary as `Date` via RSC serialization; in JSON route handlers they are ISO strings — parse them back with `z.coerce.date()` in the client schema.
