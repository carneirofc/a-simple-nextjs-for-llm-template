# Integrating multiple backends, serving multiple clients

Two directions: this app **consumes** other backends (payments, CRM, internal services, legacy APIs), and this app **is consumed** by clients other than its own web UI (mobile apps, partner services, scripts).

## Consuming backends: gateway per backend (anti-corruption layer)

Each backend gets a folder that translates its world into ours. Nothing outside it sees the backend's wire format.

```text
src/server/integrations/<backend>/
  <backend>-client.ts       # transport: base URL + credentials from env, timeout, retries, typed errors
  <backend>-schemas.ts      # Zod schemas of THEIR payloads (validate every response)
  <backend>-mapper.ts       # pure: their DTO → our domain type (unit-tested with recorded fixtures)
  <backend>-gateway.ts      # implements a port from src/server/<domain>/<domain>-ports.ts
  fake-<backend>-gateway.ts # in-memory implementation for tests and local dev
```

- **Port first.** The feature depends on `PaymentsGateway` (our vocabulary), created by the composition root ([dependency-injection.md](dependency-injection.md)). Swapping providers, or running locally without the backend (`<BACKEND>_URL` unset ⇒ fake in development, error in production, like `getDb()`), is a container change.
- **Validate responses** with Zod: a backend is untrusted input. Zod objects strip unknown keys by default, which is the *tolerant reader* you want: new fields don't break us; missing required fields fail loudly at the edge with a clear error.
- **Config** in `src/env.ts` + `.env.example`: `<BACKEND>_URL`, `<BACKEND>_API_KEY`, optional `<BACKEND>_TIMEOUT_MS`. Credentials never reach the client; all calls are server-side.

### Resilience (in `<backend>-client.ts`)

| Concern | Rule |
| --- | --- |
| Timeouts | Every call has one: `fetch(url, { signal: AbortSignal.timeout(ms) })`. No unbounded awaits. |
| Retries | Only idempotent requests (GET, PUT, DELETE, or POST with an idempotency key), only on network errors / 408 / 429 / 5xx, exponential backoff with jitter, max 2–3 attempts, honour `Retry-After`. |
| Idempotency | Writes to a backend carry an `Idempotency-Key` derived from our operation ID so retries cannot double-charge. |
| Circuit breaker | When a backend is flaky enough to hurt latency, add a small breaker (open after N consecutive failures, half-open after a cooldown) in the client; until then, timeouts suffice. |
| Errors | Map transport failures to a typed error (`{ backend, status, retryable }`) with `cause`; never leak backend messages to the UI. |
| Observability | Propagate trace headers (`traceparent`) and log backend, route, status and duration. Add `instrumentation.ts` with OpenTelemetry when the first backend lands. |

### Composing several backends on one page

- **Fan out in parallel** with `Promise.all` in the use case, or better, give each backend's section its own async Server Component inside `<Suspense>` so the page streams and a slow backend only delays its own section.
- **Partial failure is normal**: `Promise.allSettled` when sections are independent; wrap optional sections in an error boundary with a fallback. A required backend failing is an unexpected error (`error.tsx`).
- **Avoid N+1** calls: batch by IDs (`getMany(ids)`), dedupe per request with React `cache()`.
- **Cache per backend** with tags named after the source (`crm:account:<id>`), invalidated by that backend's webhooks ([events.md](events.md), [caching.md](caching.md)).
- **Writes across backends** are not atomic: order them so the cheapest-to-undo goes first, use idempotency keys, and turn multi-step flows into a saga with compensations (or the outbox) instead of hoping every call succeeds.
- **Strangler fig** for replacing a legacy backend: put both adapters behind the same port and switch per feature flag in the container; delete the old adapter when the flag is removed.
- **Pass-through proxy** (catch-all route handler forwarding to a backend) only for assets/streams you do not need to understand; it bypasses validation and mapping, so authorize and allow-list paths explicitly.

## Being consumed: one core, many transports

| Client | Transport | Contract stability |
| --- | --- | --- |
| This app's UI | Server Components (reads), server actions (mutations) | Internal; action IDs change every build — never call them from outside |
| Mobile / partner / scripts | Route handlers under `src/app/api/v1/<resource>/route.ts` | Public, versioned, documented |
| Other backends notifying us | `src/app/api/webhooks/<provider>/route.ts` | Theirs; see [events.md](events.md) |

All three call the same `data.ts` use cases, so validation and authorization exist once.

### Public API rules (`/api/v1`)

Reference: `src/app/api/v1/notes/route.ts` (thin GET over `getNotesService().list()`), `src/features/notes/notes-api-schemas.ts` (explicit wire schema; `z.codec` turns ISO strings ↔ `Date`, `z.encode` strips non-contract fields), `src/server/http/json-response.ts` (`jsonWithEtag`, `problem`).


- **Explicit contracts.** Request and response bodies are hand-written Zod schemas in `<feature>/<feature>-api-schemas.ts`, not `drizzle-zod` row schemas, so a column change cannot silently break clients. A typed row → DTO mapper (unit-tested) makes `tsc` flag schema drift. Generate OpenAPI from the schemas (`z.toJSONSchema`) when the first external consumer arrives.
- **Versioning.** Breaking changes ⇒ new `/api/v2/...` handlers reusing the same core; keep v1 until consumers migrate. Additive changes (new optional fields) are not breaking.
- **Auth.** Every handler resolves the caller itself (session cookie for the browser; bearer tokens via Better Auth's `bearer`/`jwt` plugins for other clients) and authorizes in `data.ts`. `src/proxy.ts` is not an auth layer. With `getAuth()` returning `null`, protected endpoints answer `404`/`401`, never act unauthenticated.
- **Errors** use RFC 9457 `application/problem+json` via `problem(actionError)` (`type`, `status`, `code`, `fields`), mapped from the same `Result` codes the UI uses (`validation` 422, `notFound` 404, `conflict` 409, `forbidden` 403). No stack traces or backend messages.
- **Input hardening**: check `Content-Type` and body size, parse params/query/body with Zod, cap page sizes, use cursor pagination, return `Location` on `201`.
- **Idempotency**: `POST` accepts an `Idempotency-Key` header; store key → response for a window and replay it on retry.
- **Rate limiting** per client/token at the edge (proxy/CDN/gateway) and, for expensive endpoints, in the handler with a shared store when there are several instances.
- **CORS**: allow-list origins explicitly for browser consumers on other domains; never `*` with credentials.
- **HTTP caching**: `ETag` + `Cache-Control` per [caching.md](caching.md); `Vary` only on headers you actually branch on.
- **Tests**: call the exported `GET`/`POST` with a `Request` and assert status, headers and body against the response schema.
