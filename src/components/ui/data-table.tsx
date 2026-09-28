import type { ReactTable, RowData, TableFeatures } from "@tanstack/react-table";

type DataTableProps<TFeatures extends TableFeatures, TData extends RowData> = {
  table: ReactTable<TFeatures, TData>;
  emptyMessage: string;
};

export function DataTable<TFeatures extends TableFeatures, TData extends RowData>({
  table,
  emptyMessage,
}: DataTableProps<TFeatures, TData>) {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return <p className="text-zinc-500">{emptyMessage}</p>;
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
        {rows.map((row) => (
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
