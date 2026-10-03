-- Custom data migration: notes created before async processing existed have no `note.created`
-- outbox event, so nothing would ever process them. Treat them as processed.
UPDATE "notes" SET "processed_at" = "created_at" WHERE "processed_at" IS NULL;
