import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Note } from "@/server/db/schema/notes";
import { NotesTable } from "./notes-table";

const NOTE: Note = {
  id: "00000000-0000-4000-8000-000000000000",
  title: "First",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("NotesTable", () => {
  it("renders an empty state", () => {
    render(<NotesTable notes={[]} />);
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("renders one row per note", () => {
    render(<NotesTable notes={[NOTE]} />);
    expect(screen.getByRole("cell", { name: "First" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2026-01-01T00:00:00.000Z" })).toBeInTheDocument();
  });
});
