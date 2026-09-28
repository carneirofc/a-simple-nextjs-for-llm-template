"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { Note } from "@/server/db/schema/notes";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, Note>();
const columns = columnHelper.columns([
  columnHelper.accessor("title", { header: "Title" }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => info.getValue().toISOString(),
  }),
]);

type NotesTableProps = {
  notes: Note[];
};

export function NotesTable({ notes }: NotesTableProps) {
  const table = useTable({ features, columns, data: notes });

  if (notes.length === 0) {
    return <p className="text-zinc-500">No notes yet.</p>;
  }

  return (
    <table className="w-full text-left">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th className="border-b py-2" key={header.id}>
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getAllCells().map((cell) => (
              <td className="border-b py-2" key={cell.id}>
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
