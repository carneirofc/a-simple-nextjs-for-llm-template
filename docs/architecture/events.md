# Events and realtime

Scope: this template stays focused on Next.js, SSR and the browser. It ships **live UI updates** (a user action publishes an event; other open tabs refetch) and no background-job infrastructure. Durable queues, retries and workers belong to a dedicated service you plug in when a project needs them (see "Side effects" below).

## What is wired

```text
 user action ──▶ server action ──▶ data.ts use case ──▶ eventBroker.publish({ type, …ids })
                                                              │ (in-memory, best effort)
                                                              ▼
                       GET /api/v1/events (SSE, public events only) ──▶ RealtimeListener
                                                                        └▶ invalidateQueries(keys)
```

| Piece | File | Role |
| --- | --- | --- |
| `EventBroker` port + in-memory adapter | `src/server/events/event-broker.ts` | `publish(event)` / `subscribe(listener)`; one per process, chosen in `container.ts` |
| SSE response | `src/server/http/event-stream.ts` | `text/event-stream`, heartbeat, `retry:`, cleans up on disconnect |
| SSE route | `src/app/api/v1/events/route.ts` | forwards only events declared public (flag `FEATURE_REALTIME`) |
| Public events registry | `src/app/_events/realtime-events.ts` | `combineRealtimeEvents([...feature matchers])` |
| Browser | `src/lib/use-event-source.ts`, `src/app/_events/realtime-listener.tsx` | native `EventSource`; invalidates the query keys each event maps to; full resync after reconnect |
| Example | `src/features/notes/notes-events.ts`, `data.ts` `create` | `note.created` → every open tab refetches the notes list |

## Rules

- **Events are data**: a Zod discriminated union per feature in `<feature>/<feature>-events.ts` (client-safe). Past tense `<entity>.<verb-ed>`, **thin** (IDs only); clients refetch through the normal authorized API instead of trusting pushed data.
- **Publish from the use case, after the write succeeded**: `eventBroker.publish({ type: "note.created", noteId })` in `data.ts`. Never from components or route handlers directly.
- **Declare what browsers may see**: `export const <feature>RealtimeEvents = defineRealtimeEvents(schema, (event) => [<feature>Cache.key.all])`, then add it to `src/app/_events/realtime-events.ts`. Anything not declared never leaves the server.
- **Invalidate, don't push data**: the listener calls `invalidateQueries`; `setQueryData` only for tiny self-contained updates.
- **Best effort only**: an event published while nobody listens is lost. Correctness must never depend on it; clients resync on reconnect and TanStack Query refetches on focus.
- **Per-user events**: resolve the caller in the SSE route and filter by user/tenant before `send`; the template's events carry only IDs of shared data.
- **Multiple instances**: the in-memory broker reaches only SSE connections on the same instance. Before scaling out, implement `EventBroker` with Redis pub/sub (or Postgres `LISTEN/NOTIFY`) and select it in `src/server/container.ts`.
- **Serverless**: long-lived SSE needs streaming support; otherwise turn `FEATURE_REALTIME` off and use `refetchInterval`.
- Next route handlers cannot upgrade to WebSockets; for bidirectional realtime use a separate service (Socket.IO, PartyKit) or a hosted one (Ably, Pusher).

## Side effects

- **After the response, same process, best effort** (analytics, logging, cache warming): `after(() => …)` from `next/server`. In Server Components read `cookies()`/`headers()` before `after`.
- **Must not be lost / long-running / retried** (emails, billing, exports, AI processing): not in this template. Hand the work to a job service from the use case and keep the handler code there:

| Option | When |
| --- | --- |
| Inngest, Trigger.dev | durable multi-step workflows, hosted or self-hosted, HTTP-invoked steps (serverless friendly) |
| pg-boss | already on Postgres, need cron/priorities/retries, long-running worker process |
| BullMQ | Redis already present |
| Vercel Queues / SQS | platform-native queues |

Wrap the client in a port (`JobQueue.enqueue(job) → { id }`) in `src/server/integrations/<service>/` like any external backend ([integrations.md](integrations.md)), call it from `data.ts`, and report progress back to the browser by publishing thin events (`job.updated`) through the `EventBroker`.

## Inbound webhooks

`src/app/api/webhooks/<provider>/route.ts`: verify the signature (constant-time) with a secret from `src/env.ts`, parse with the provider's Zod schema, dedupe by the provider's event ID, call the use case, reply `2xx` fast. Heavy work goes to `after()` or a job service.
