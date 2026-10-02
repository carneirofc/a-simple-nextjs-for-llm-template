import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldErrors } from "./field-errors";

describe("FieldErrors", () => {
  it("renders one alert per error", () => {
    render(<FieldErrors errors={[{ message: "Required" }, { message: "Too short" }]} />);
    expect(screen.getAllByRole("alert").map((node) => node.textContent)).toEqual([
      "Required",
      "Too short",
    ]);
  });

  it("renders nothing without errors", () => {
    render(<FieldErrors errors={[]} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("collapses duplicate messages", () => {
    render(<FieldErrors errors={[{ message: "Required" }, { message: "Required" }, undefined]} />);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
