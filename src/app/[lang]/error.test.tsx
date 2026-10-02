import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

const params = vi.hoisted(() => ({ lang: "en" }));
vi.mock("next/navigation", () => ({ useParams: () => params }));

function renderError(retry = vi.fn()) {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const error = Object.assign(new Error("boom"), { digest: "abc123" });
  render(<ErrorPage error={error} retry={retry} />);
  return retry;
}

describe("ErrorPage", () => {
  it("shows the digest and retries on click", async () => {
    params.lang = "en";
    const retry = renderError();

    expect(screen.getByText("Error reference: abc123")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("uses the locale from the URL", () => {
    params.lang = "pt";
    renderError();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
