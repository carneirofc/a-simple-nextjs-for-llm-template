# Event-driven patterns

Events decouple "something happened" from "what else must happen because of it". Use the lightest level that meets the delivery guarantee you need.

| Level | Guarantee | Use for | Status |
| --- | --- | --- | --- |
| 1. Direct call + `after()` | best effort, same process | logging, analytics, cache warming, non-critical emails | Rule |
| 2. In-process domain events | best effort, same process, decoupled handlers | a write that triggers several independent reactions | Rule |
| 3. Transactional outbox + worker | at-least-once, survives crashes | anything that must not be lost: billing, cross-service sync, notifications users rely on | Proposed |
| 4. Push to browsers (SSE) | best effort, live | other users must see a change without reloading | Proposed |

## Event contract

Events are data, so they are Zod schemas (types via `z.infer`), one discriminated union per domain, in `src/server/events/<domain>-events.ts`:

```ts
export const noteEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("note.created"), id: z.uuid(), occurredAt: z.date(), noteId: z.uuid() }),
  z.object({ type: z.literal("note.deleted"), id: z.uuid(), occurredAt: z.date(), noteId: z.uuid() }),
]);
```

- Name in the past tense, `<entity>.<verb-ed>`; include an event `id` (for dedupe) and `occurredAt`.
- **Thin events**: carry IDs, not full entities. Consumers re-read through the normal, authorized path, which keeps caches and permissions correct.
- Version by adding a new `type` (`note.created.v2`) rather than changing an existing payload.

## 1. `after()` for side effects

`after(() => …)` from `next/server` runs after the response is sent (works in Server Components, actions, route handlers, proxy). Use it for work the user should not wait for. It is not durable: a crash or deploy loses it. In Server Components read `cookies()`/`headers()` before `after`, not inside it.

## 2. In-process event bus

When the first write has two or more reactions, add a typed bus in `src/server/events/event-bus.ts`, provided by the container ([dependency-injection.md](dependency-injection.md)):

- `publish(event)` validates with the schema, then runs subscribers inside `after()` so they never delay or fail the request.
- Subscribers are registered in the composition root, one file per reaction (`on-note-created-revalidate.ts`), each idempotent and each catching its own errors.
- Publish **after the DB transaction commits**, never inside it.
- Typical subscribers: cache invalidation (`revalidateTag(tag, "max")`), audit log row, SSE fan-out (level 4).

Remember: in-memory handlers run only on the instance that handled the request.

## 3. Transactional outbox (durable, cross-service)

Use when an event must survive a crash or reach another service:

1. In the **same Drizzle transaction** as the state change, insert a row into an `outbox` table (`id`, `type`, `payload` jsonb validated by the event schema, `createdAt`, `publishedAt`).
2. A **separate worker process** (not a Next route; serverless routes time out) polls `FOR UPDATE SKIP LOCKED` or `LISTEN`s, publishes to the broker (Postgres `NOTIFY`, Redis Streams, NATS, SQS, Kafka) and sets `publishedAt`.
3. Consumers are **idempotent**: record processed event IDs (`inbox` table, unique constraint) and skip duplicates. Delivery is at-least-once; ordering is per aggregate at best.

This avoids the dual-write bug (DB committed, message lost — or the reverse). A multi-backend write that needs all-or-nothing becomes a **saga**: each step emits an event; failures trigger compensating actions, never a distributed transaction.

## 4. Real-time updates to clients

- Prefer **Server-Sent Events** from a route handler (`text/event-stream`, `ReadableStream`), one-way server → browser, works through HTTP proxies. Next route handlers cannot upgrade to WebSockets; use a separate service if you need bidirectional realtime.
- Send **invalidation messages**, not data: `{ "type": "note.created", "keys": [["notes"]] }`. The client calls `queryClient.invalidateQueries({ queryKey })`, so data still flows through the cached, authorized read path.
- Authorize the stream on connect; filter events per user/tenant on the server.
- With several instances, fan out through a shared channel (Postgres `LISTEN/NOTIFY` or Redis pub/sub), since the instance holding the SSE connection is not the one that handled the write.
- Long-lived connections need a host that allows them (self-hosted Node); on serverless, fall back to polling with `refetchInterval`.

## Inbound webhooks from other backends

`src/app/api/webhooks/<provider>/route.ts`:

1. Read the raw body, **verify the signature** (constant-time compare) with the secret from `src/env.ts`; reject otherwise.
2. Parse with the provider's Zod schema; ignore unknown event types (tolerant reader).
3. **Dedupe** by the provider's event ID (inbox table or unique constraint).
4. Do the minimum synchronously (record, `revalidateTag(tag, "max")` or `{ expire: 0 }`), reply `2xx` fast; heavy work goes to `after()` or the outbox.
