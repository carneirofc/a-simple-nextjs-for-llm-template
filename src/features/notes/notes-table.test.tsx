import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { ptBr } from "@/i18n/dictionaries/pt-br";
import type { Note } from "@/server/db/schema/notes";
import { NotesTable } from "./notes-table";

const NOTE: Note = {
  id: "00000000-0000-4000-8000-000000000000",
  title: "First",
  createdAt: new Date("2026-01-01T13:00:00.000Z"),
};

describe("NotesTable", () => {
  it("renders an empty state", () => {
    render(<NotesTable labels={en.notes.table} locale="en" notes={[]} />);
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("renders one row per note with a localized date", () => {
    render(<NotesTable labels={en.notes.table} locale="en" notes={[NOTE]} />);
    expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "First" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /^Jan 1, 2026.*01:00\sPM UTC$/ })).toBeInTheDocument();
  });

  it("translates headers and dates", () => {
    render(<NotesTable labels={ptBr.notes.table} locale="pt-BR" notes={[NOTE]} />);
    expect(screen.getByRole("columnheader", { name: "Criada em" })).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: /^1 de jan\. de 2026.*13:00 UTC$/ }),
    ).toBeInTheDocument();
  });
});
