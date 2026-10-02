import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleSwitcher } from "./locale-switcher";

vi.mock("next/navigation", () => ({ usePathname: () => "/en/notes" }));

describe("LocaleSwitcher", () => {
  it("links every locale to the same page and marks the current one", () => {
    render(<LocaleSwitcher current="en" label="Language" />);

    expect(screen.getByRole("navigation", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
    const pt = screen.getByRole("link", { name: "Português" });
    expect(pt).toHaveAttribute("href", "/pt/notes");
    expect(pt).not.toHaveAttribute("aria-current");
  });
});
