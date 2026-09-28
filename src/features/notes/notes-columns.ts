import { createColumnHelper, tableFeatures } from "@tanstack/react-table";
import type { Note } from "@/server/db/schema/notes";

export const notesTableFeatures = tableFeatures({});

const columnHelper = createColumnHelper<typeof notesTableFeatures, Note>();

export const notesColumns = columnHelper.columns([
  columnHelper.accessor("title", { header: "Title" }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => info.getValue().toISOString(),
  }),
]);
