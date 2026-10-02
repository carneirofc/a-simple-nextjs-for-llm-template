"use client";

import { useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Note } from "@/server/db/schema/notes";
import { createNotesColumns, notesTableFeatures } from "./notes-columns";

type NotesTableProps = {
  notes: Note[];
  labels: Dictionary["notes"]["table"];
  locale: Locale;
};

export function NotesTable({ notes, labels, locale }: NotesTableProps) {
  const columns = useMemo(() => createNotesColumns(labels, locale), [labels, locale]);
  const table = useTable({ features: notesTableFeatures, columns, data: notes });

  return <DataTable emptyMessage={labels.empty} table={table} />;
}
