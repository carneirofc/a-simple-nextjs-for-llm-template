"use client";

import { useTable } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import type { Note } from "@/server/db/schema/notes";
import { notesColumns, notesTableFeatures } from "./notes-columns";

type NotesTableProps = {
  notes: Note[];
};

export function NotesTable({ notes }: NotesTableProps) {
  const table = useTable({ features: notesTableFeatures, columns: notesColumns, data: notes });

  return <DataTable emptyMessage="No notes yet." table={table} />;
}
