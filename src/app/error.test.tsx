import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("ErrorPage", () => {
  it("shows the digest and retries on click", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const retry = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<ErrorPage error={error} retry={retry} />);

    expect(screen.getByText("Error reference: abc123")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
