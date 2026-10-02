import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

const INPUT_ID = "name";

describe("Label", () => {
  it("labels the referenced control", () => {
    render(
      <>
        <Label htmlFor={INPUT_ID}>Name</Label>
        <input id={INPUT_ID} />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveAttribute("id", INPUT_ID);
  });

  it("merges custom classes", () => {
    render(<Label className="sr-only">Hidden</Label>);
    expect(screen.getByText("Hidden")).toHaveClass("font-medium", "sr-only");
  });
});
