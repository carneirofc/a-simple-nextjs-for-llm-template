import { queryOptions } from "@tanstack/react-query";
import { fetchNotes } from "./notes-api-client";
import { notesCache } from "./notes-cache";

/** Client reads via the API route; server prefetch overrides `queryFn` with `data.ts`. */
export const notesQueryOptions = queryOptions({
  queryKey: notesCache.key.list(),
  queryFn: fetchNotes,
});
