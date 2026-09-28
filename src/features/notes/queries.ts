import { queryOptions } from "@tanstack/react-query";
import { listNotes } from "./actions";

export const notesQueryKey = ["notes"] as const;

export const notesQueryOptions = queryOptions({
  queryKey: notesQueryKey,
  queryFn: () => listNotes(),
});
