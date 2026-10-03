"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { createNote } from "./actions";
import { notesCache } from "./notes-cache";
import { NotesForm } from "./notes-form";
import { NotesTable } from "./notes-table";
import { notesQueryOptions } from "./queries";

type NotesPanelProps = {
  labels: Dictionary["notes"];
  validation: Dictionary["validation"];
  locale: Locale;
};

export function NotesPanel({ labels, validation, locale }: NotesPanelProps) {
  const queryClient = useQueryClient();
  const { data: notes } = useSuspenseQuery(notesQueryOptions);
  const { mutateAsync } = useMutation({
    mutationFn: createNote,
    onSuccess: async (result) => {
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: notesCache.key.all });
      }
    },
  });

  return (
    <section className="flex flex-col gap-4">
      <NotesForm labels={labels.form} onSubmit={mutateAsync} validation={validation} />
      <NotesTable labels={labels.table} locale={locale} notes={notes} />
    </section>
  );
}
