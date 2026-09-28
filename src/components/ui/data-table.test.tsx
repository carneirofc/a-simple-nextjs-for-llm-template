import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./data-table";

type Row = { name: string };

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, Row>();
const columns = columnHelper.columns([columnHelper.accessor("name", { header: "Name" })]);

function renderTable(data: Row[]) {
  const { result } = renderHook(() => useTable({ features, columns, data }));
  render(<DataTable emptyMessage="Empty" table={result.current} />);
}

describe("DataTable", () => {
  it("renders the empty message without rows", () => {
    renderTable([]);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders headers and cells", () => {
    renderTable([{ name: "Ada" }]);
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
  });
});
