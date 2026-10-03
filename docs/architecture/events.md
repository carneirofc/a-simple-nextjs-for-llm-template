# Event-driven patterns

Events decouple "something happened" from "what else must happen because of it". The template ships a working pipeline: **transactional outbox → event processor (queue with retries) → live fan-out → SSE → TanStack Query invalidation**. `notes` is the reference: creating a note emits `note.created`; a handler processes the note asynchronously and emits `note.processed`; open browsers refetch and the row flips from "Processing…" to "Ready".

```text
 action/route ──tx──▶ notes row + outbox_events row      (one transaction: both or neither)
                            │
        poller (instrumentation.ts, every JOBS_POLL_INTERVAL_MS) or POST /api/internal/jobs
                            ▼
 event processor: claim (FOR UPDATE SKIP LOCKED) → handlers → done | retry (backoff) | failed
                            │ publish (after success)
                            ▼
 EventBroker ──▶ GET /api/v1/events (SSE, public events only) ──▶ RealtimeListener
                                                                  └▶ invalidateQueries(keys)
```

| Level | Guarantee | Use for | Where |
| --- | --- | --- | --- |
| `after()` | best effort, same process | logging, analytics, cache warming | `next/server` |
| Outbox + processor | at-least-once, survives crashes and deploys | anything that must not be lost: processing, notifications, sync to other services | `src/server/events/` |
| SSE | best effort, live | other tabs/users must see a change without reloading | `/api/v1/events` + `src/app/_events/` |

There is deliberately no fire-and-forget in-memory event bus: every domain event goes through the outbox, so one mechanism covers retries, crash recovery and fan-out.

## Library choices (researched October 2026)

| Need | Chosen | Why | Move up to |
| --- | --- | --- | --- |
| Queue / outbox | **Own Drizzle outbox** (`outbox_events`, `SELECT … FOR UPDATE SKIP LOCKED`) | Enqueue is a plain insert in the business transaction; no extra DB client, schema or raw SQL; runs on PGlite (dev) and Postgres (prod) unchanged | **pg-boss** (MIT, Postgres; cron, priorities, singleton jobs; transactional `send` via its `db.executeSql` option) when you need scheduling or richer queue semantics |
| Durable multi-step workflows | — | Not needed yet | **Inngest**, **Trigger.dev**, **Hatchet** (hosted or self-hosted engines). Feed them from the outbox: their APIs cannot join your DB transaction |
| Redis queue | — | No Redis in the stack | **BullMQ** if Redis is already present (enqueue cannot join the DB transaction) |
| Browser realtime | **Native `EventSource`** + route handler SSE | Built in: auto-reconnect, `Last-Event-ID`, same-origin cookies; no dependency | `eventsource-parser` when you need auth headers/POST over `fetch`; avoid `@microsoft/fetch-event-source` (unmaintained since 2021) |
| Bidirectional realtime | — | Next route handlers cannot upgrade to WebSockets | A separate service (Socket.IO, PartyKit) or hosted (Ably, Pusher) |
| Multi-instance fan-out | In-memory broker (single instance) | Simple, correct for one process | Postgres `LISTEN/NOTIFY` (postgres-js `sql.listen`/`sql.notify`; PGlite `listen`): no new infra, payload < 8 KB, not through PgBouncer transaction pooling. Redis pub/sub if Redis exists |

TanStack Query: invalidate on event (`invalidateQueries`) rather than pushing data into the cache; `setQueryData` only for tiny, self-contained updates. `experimental_streamedQuery` is for streaming one query's data (e.g. LLM tokens), not for cache invalidation.

## Event contract

Events are data: Zod discriminated unions per feature in `<feature>/<feature>-events.ts` (client-safe, so the browser can parse them too):

```ts
export const noteEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("note.created"), noteId: z.uuid() }),
  z.object({ type: z.literal("note.processed"), noteId: z.uuid() }),
]);
```

- Past tense, `<entity>.<verb-ed>`. **Thin**: IDs, not entities. Consumers re-read through the normal, authorized path.
- The outbox row supplies `id` (dedupe, SSE `id:`) and `createdAt` (`occurredAt`).
- Version by adding a new `type` (`note.created.v2`), never by changing a payload in place.

## Emitting: transactional outbox

Write the event in the same unit of work as the state change (`src/server/unit-of-work.ts`):

```ts
const note = await transaction(async ({ notesRepo, outbox }) => {
  const created = await notesRepo.insert(values);
  await outbox.enqueue({ type: "note.created", noteId: created.id });
  return created;
});
```

Never publish after commit "by hand": that is the dual-write bug (state committed, event lost, or the reverse).

## Handling: the event processor

- **Handlers** live in `<feature>/<feature>-event-handlers.ts` (`server-only`), are built from container deps, and are registered in `src/app/_events/event-handlers.ts` (`mergeEventHandlers`). Each parses its payload with the event schema.
- **At-least-once**: a handler may run twice (crash after the work, before `complete`). Make it idempotent: conditional updates (`markProcessed` only when `processedAt` is null), unique constraints, or an inbox table of processed event IDs.
- **Follow-up events** are enqueued inside the handler's own unit of work, only when the state actually changed.
- **Retries**: a thrown error schedules a retry with exponential backoff (2 s … 5 min, `retry-policy.ts`); after `maxAttempts` (5) the row becomes `failed` (dead letter) with `lastError`. Replay by setting it back to `pending`.
- **Crash recovery**: a `running` row whose lock is older than 5 min is reclaimed; attempts are counted at claim time, so a job that kills the process still runs out of attempts.
- Events without handlers are completed and still fanned out (that is how `note.processed` reaches browsers).

## Running the processor

| `JOBS_RUNNER` | How | When |
| --- | --- | --- |
| `inline` (default) | `src/instrumentation.ts` → `startInlineJobsRunner()` polls every `JOBS_POLL_INTERVAL_MS` inside each Node server instance (skipped in Edge and during `next build`) | `next dev` (required with PGlite: single process), self-hosted `next start`, containers. Several instances are safe: `SKIP LOCKED` |
| `external` | A scheduler calls `POST /api/internal/jobs` with `Authorization: Bearer $JOBS_SECRET`; each call drains one batch | Serverless (no long-lived process), or a dedicated worker deployment calling it in a loop |

## Delivering to browsers (SSE)

- `GET /api/v1/events` (flag `FEATURE_REALTIME`) subscribes to the broker and forwards only events some feature declared public in `src/app/_events/realtime-events.ts` (`defineRealtimeEvents(schema, keysFor)`); everything else stays server-side. Heartbeat every 25 s, `retry: 3000`, `X-Accel-Buffering: no`.
- `RealtimeListener` (mounted in the root layout when the flag is on) uses `useEventSource` and invalidates the query keys each event maps to. **After a reconnect it invalidates everything**: events sent while disconnected are not replayed.
- **Authorization**: the stream carries IDs of shared notes only. For per-user data, resolve the caller in the route and filter events by user/tenant before `send`.
- **Multiple instances**: the in-memory broker only reaches SSE connections on the instance that processed the event. Before scaling out, implement a `LISTEN/NOTIFY` (or Redis) `EventBroker` adapter and select it in `src/server/container.ts`; nothing else changes.
- **Serverless**: long-lived SSE needs a platform that supports streaming responses; otherwise disable `FEATURE_REALTIME` and use `refetchInterval`.

## Inbound webhooks from other backends

`src/app/api/webhooks/<provider>/route.ts`:

1. Read the raw body, **verify the signature** (constant-time compare, like `bearer-token.ts`) with the secret from `src/env.ts`; reject otherwise.
2. Parse with the provider's Zod schema; ignore unknown event types (tolerant reader).
3. **Dedupe** by the provider's event ID (unique constraint), then enqueue a domain event in the outbox and reply `2xx` fast. All real work happens in handlers.
