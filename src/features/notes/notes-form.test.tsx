import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { pt } from "@/i18n/dictionaries/pt";
import { NotesForm } from "./notes-form";

describe("NotesForm", () => {
  it("submits the trimmed title and resets", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NotesForm labels={en.notes.form} onSubmit={onSubmit} validation={en.validation} />);

    const input = screen.getByLabelText("Title");
    await userEvent.type(input, "  Buy milk ");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: "Buy milk" }));
    expect(input).toHaveValue("");
  });

  it("shows a validation error for an empty title", async () => {
    const onSubmit = vi.fn();
    render(<NotesForm labels={en.notes.form} onSubmit={onSubmit} validation={en.validation} />);

    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This field is required");
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders labels and validation errors in the given language", async () => {
    render(<NotesForm labels={pt.notes.form} onSubmit={vi.fn()} validation={pt.validation} />);

    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Este campo é obrigatório");
  });
});
