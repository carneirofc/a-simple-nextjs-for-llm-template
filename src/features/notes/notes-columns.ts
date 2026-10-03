import { createColumnHelper, tableFeatures } from "@tanstack/react-table";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatDateTime } from "@/i18n/format";
import type { Note } from "@/server/db/schema/notes";

export const notesTableFeatures = tableFeatures({});

const columnHelper = createColumnHelper<typeof notesTableFeatures, Note>();

/** Column defs depend on the locale (headers, date format); memoize at the call site. */
export function createNotesColumns(labels: Dictionary["notes"]["table"], locale: Locale) {
  return columnHelper.columns([
    columnHelper.accessor("title", { header: labels.title }),
    columnHelper.accessor("createdAt", {
      header: labels.created,
      cell: (info) => formatDateTime(info.getValue(), locale),
    }),
    // `processedAt` is filled in asynchronously; realtime events refresh this column.
    columnHelper.accessor("processedAt", {
      header: labels.status,
      cell: (info) => (info.getValue() ? labels.ready : labels.processing),
    }),
  ]);
}
