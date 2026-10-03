import * as z from "zod";

/**
 * Generic shape every event shares. Features define the concrete events as Zod discriminated unions
 * on `type` (`<entity>.<verb-ed>`, thin: IDs, not entities) and parse payloads with them.
 */
export const domainEventSchema = z.looseObject({ type: z.string().min(1) });

export type DomainEvent = z.infer<typeof domainEventSchema>;

/** An event after it was stored: what handlers, the broker and SSE clients receive. */
export const publishedEventSchema = z.object({
  id: z.uuid(),
  occurredAt: z.date(),
  event: domainEventSchema,
});

export type PublishedEvent = z.infer<typeof publishedEventSchema>;

/** Wraps an event for live fan-out. Ephemeral events (progress, presence) get a fresh id. */
export function toPublishedEvent(
  event: DomainEvent,
  { id = crypto.randomUUID(), occurredAt }: { id?: string; occurredAt: Date },
): PublishedEvent {
  return { id, occurredAt, event };
}

/** What a handler knows about the job it runs, and how it reports back. */
export type HandlerContext = {
  readonly jobId: string;
  /** 1 on the first run; > 1 on retries. */
  readonly attempt: number;
  /** Persists 0–100 progress and pushes a `job.updated` event to subscribed browsers. */
  readonly reportProgress: (progress: number) => Promise<void>;
};

/**
 * Runs the work for one message. A returned value (JSON-serializable) becomes the job's `result`;
 * throwing schedules a retry.
 */
export type EventHandler = (event: DomainEvent, context: HandlerContext) => Promise<unknown>;

/** Handlers per event type. Every handler must be idempotent: delivery is at-least-once. */
export type EventHandlers = Readonly<Record<string, readonly EventHandler[]>>;

export function mergeEventHandlers(...groups: readonly EventHandlers[]): EventHandlers {
  const merged: Record<string, EventHandler[]> = {};
  for (const group of groups) {
    for (const [type, handlers] of Object.entries(group)) {
      merged[type] = [...(merged[type] ?? []), ...handlers];
    }
  }
  return merged;
}
