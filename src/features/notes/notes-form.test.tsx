import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotesForm } from "./notes-form";

describe("NotesForm", () => {
  it("submits the trimmed title and resets", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NotesForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText("Title");
    await userEvent.type(input, "  Buy milk ");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: "Buy milk" }));
    expect(input).toHaveValue("");
  });

  it("shows a validation error for an empty title", async () => {
    const onSubmit = vi.fn();
    render(<NotesForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Title is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
