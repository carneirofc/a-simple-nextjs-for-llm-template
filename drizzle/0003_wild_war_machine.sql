ALTER TABLE "outbox_events" ADD COLUMN "progress" integer;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "result" jsonb;