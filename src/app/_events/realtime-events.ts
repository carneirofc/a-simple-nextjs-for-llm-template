import { notesRealtimeEvents } from "@/features/notes/notes-events";
import { combineRealtimeEvents } from "@/lib/realtime";

// Every event type browsers may receive, with the query keys it invalidates. Used by the SSE route
// (to filter what leaves the server) and by `RealtimeListener` (to invalidate). Add features here.

export const REALTIME_EVENTS_PATH = "/api/v1/events";

export const matchRealtimeEvent = combineRealtimeEvents([notesRealtimeEvents]);
