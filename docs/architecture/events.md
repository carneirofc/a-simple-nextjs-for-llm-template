# Event-driven patterns

Events decouple "something happened" or "please do this" from the code that does the work. Work enters one queue (the `MessageQueue` port, Postgres-backed by default) through three doors, is processed by the same event processor, and is reported to browsers over SSE.

| Door | Use when | API | Durable | Example in `notes` |
| --- | --- | --- | --- | --- |
| **1. Event from a write** | a state change must trigger work | `transaction(({ outbox }) => outbox.enqueue(event))` | yes, commits with the write | `create` → `note.created` → handler sets `processedAt` |
| **2. User/client-triggered job** | someone asks for work directly: a button, an API call, a webhook, a schedule | `queue.enqueue(job, { runAt?, maxAttempts? })` → `{ id }` | yes | "Generate report" → `notes.report-requested` → progress + result |
| **3. Ephemeral event** | live-only signals: progress, presence, "someone is typing" | `eventBroker.publish(toPublishedEvent(event, { occurredAt }))` | no (lost if nobody listens) | `job.updated` (published by the processor) |

```text
 door 1: action ──tx──▶ state row + queue row          door 2: action / route / webhook ──▶ queue row ─▶ { jobId }
                               │                                                                  │
                               └───────────────▶ outbox_events (MessageQueue) ◀───────────────────┘
                                                        │ poller (instrumentation.ts) or POST /api/internal/jobs
                                                        ▼
            event processor: claim (SKIP LOCKED) → handlers(event, { jobId, attempt, reportProgress })
                             → done (+ result) | retry (backoff) | failed (dead letter)
                                                        │ publish: domain event + job.updated (door 3)
                                                        ▼
            EventBroker ──▶ GET /api/v1/events (SSE, public events only) ──▶ RealtimeListener
                                                                             └▶ invalidateQueries(keys)
            browser: useJob(jobId) ◀── GET /api/v1/jobs/:id (status, progress, result) ◀┘
```

| Mechanism | Guarantee | Where |
| --- | --- | --- |
| Queue + processor | at-least-once, retries, survives crashes and deploys | `src/server/events/` |
| Job tracking | status/progress/result per job id | `GET /api/v1/jobs/:id`, `src/lib/jobs.ts`, `src/lib/use-job.ts` |
| SSE | best effort, live | `/api/v1/events` + `src/app/_events/` |
| `after()` | best effort, same process, no retries | `next/server` (logging, analytics) |

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

## Door 1 — events from writes (transactional outbox)

Write the event in the same unit of work as the state change (`src/server/unit-of-work.ts`):

```ts
const note = await transaction(async ({ notesRepo, outbox }) => {
  const created = await notesRepo.insert(values);
  await outbox.enqueue({ type: "note.created", noteId: created.id });
  return created;
});
```

Never publish after commit "by hand": that is the dual-write bug (state committed, event lost, or the reverse).

## Door 2 — user/client-triggered jobs

Not every job comes from a write. A user clicks "Generate report", a mobile client asks for an export, a webhook says "invoice paid", a scheduler fires. The use case enqueues directly and returns the job id:

```ts
// data.ts — validate + authorize like any use case, then enqueue
requestReport: async (): Promise<ActionResult<{ jobId: string }>> => {
  const { id } = await queue.enqueue({ type: "notes.report-requested" });
  return ok({ jobId: id });
},
```

- **Schemas** for the request and the result live in `<feature>-jobs.ts` (client-safe; the UI parses `job.result` with the same schema the handler returns).
- **Transports**: a server action for the UI (`requestNotesReport`), a `POST /api/v1/<feature>/<job>` route returning `202 Accepted` + `Location: /api/v1/jobs/<id>` for other clients, a webhook route after signature verification, or a scheduler calling a route. All of them call the same `data.ts` function.
- **Options**: `runAt` (delay/schedule), `maxAttempts`. For de-duplication of repeated clicks, check for an existing pending job of the same type/subject in the use case, or add an idempotency key column when needed.
- **Tracking in the UI**: keep the returned `jobId` in state and call `useJob(jobId)`. It reads `GET /api/v1/jobs/:id` (status, progress, attempts, result, error — never the payload); `job.updated` SSE events invalidate it, and it polls every 5 s as a fallback until the job finishes. See `notes-report.tsx`.
- **Authorization**: job ids are unguessable UUIDs, but jobs with per-user results must record the requester (add a column) and the status route must check it.

## Door 3 — ephemeral events

Live-only signals go straight to the broker, skipping the queue: `eventBroker.publish(toPublishedEvent(event, { occurredAt: clock() }))`. They reach browsers only if declared public with `defineRealtimeEvents`, are not retried and are lost when nobody is connected. The processor uses this for `job.updated`; use it for presence or typing indicators. Anything that must happen goes through door 1 or 2.

## Swapping the queue backend

Features only see the `MessageQueue` port (`enqueue`) and handlers. To move to pg-boss, BullMQ, SQS or a workflow engine, write an adapter for `MessageQueue` (and run that system's worker with the same `EventHandlers` registry) and select it in `src/server/container.ts`. Keep door 1 on the outbox (only the database can commit an event atomically with a write) and relay outbox rows to the new system if it should process them.

## Handling: the event processor (all doors)

- **Handlers** live in `<feature>/<feature>-event-handlers.ts` (`server-only`), are built from container deps, and are registered in `src/app/_events/event-handlers.ts` (`mergeEventHandlers`). Each parses its payload with the event schema.
- **At-least-once**: a handler may run twice (crash after the work, before `complete`). Make it idempotent: conditional updates (`markProcessed` only when `processedAt` is null), unique constraints, or an inbox table of processed event IDs.
- **Context**: `handler(event, { jobId, attempt, reportProgress })`. `reportProgress(0–100)` persists progress and pushes `job.updated`; a returned JSON value becomes the job `result`.
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

- The processor publishes `job.updated` on every status change and progress report; `jobsRealtimeEvents` maps it to `jobsCache.key.detail(id)`.
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
