import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("defaults to type=button and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies the variant classes", () => {
    render(<Button variant="ghost">Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("border");
  });

  it("renders its child with button styles when asChild is set", () => {
    render(
      <Button asChild={true} variant="ghost">
        <a href="/notes">Notes</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Notes" });
    expect(link).toHaveClass("border");
    expect(link).not.toHaveAttribute("type");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets a custom className override base classes", () => {
    render(<Button className="px-2">Tight</Button>);
    const button = screen.getByRole("button", { name: "Tight" });
    expect(button).toHaveClass("px-2");
    expect(button).not.toHaveClass("px-4");
  });
});
