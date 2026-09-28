"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createNote } from "./actions";
import { NotesForm } from "./notes-form";
import { NotesTable } from "./notes-table";
import { notesQueryKey, notesQueryOptions } from "./queries";

export function NotesPanel() {
  const queryClient = useQueryClient();
  const { data: notes } = useSuspenseQuery(notesQueryOptions);
  const { mutateAsync } = useMutation({
    mutationFn: createNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryKey }),
  });

  return (
    <section className="flex flex-col gap-4">
      <NotesForm onSubmit={mutateAsync} />
      <NotesTable notes={notes} />
    </section>
  );
}
