import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextInput } from "./text-input";

const EMAIL_ID = "email";
const SEARCH_ID = "search";

describe("TextInput", () => {
  it("links the label to the input", () => {
    render(<TextInput id={EMAIL_ID} label="Email" readOnly={true} value="a@b.c" />);
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.c");
  });

  it("visually hides the label when requested", () => {
    render(<TextInput hideLabel={true} id={SEARCH_ID} label="Search" />);
    expect(screen.getByText("Search")).toHaveClass("sr-only");
  });
});
