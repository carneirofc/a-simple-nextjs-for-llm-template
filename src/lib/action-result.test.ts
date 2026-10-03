import { describe, expect, it } from "vitest";
import * as z from "zod";
import { fail, ok, toFieldErrors, validationFailure } from "./action-result";

describe("action-result", () => {
  it("wraps success and failure", () => {
    expect(ok(1)).toEqual({ ok: true, data: 1 });
    expect(fail({ code: "notFound" })).toEqual({ ok: false, error: { code: "notFound" } });
  });

  it("groups Zod issues by top-level field", () => {
    const schema = z.object({ title: z.string().min(1, "required").max(1, "tooLong") });
    const error = schema.safeParse({ title: "" }).error;
    if (!error) {
      throw new Error("expected a validation error");
    }
    expect(validationFailure(error)).toEqual({
      ok: false,
      error: { code: "validation", fields: { title: ["required"] } },
    });
  });

  it("collects form-level issues under an empty key", () => {
    const schema = z.string().min(2, "tooShort");
    const error = schema.safeParse("x").error;
    if (!error) {
      throw new Error("expected a validation error");
    }
    expect(validationFailure(error)).toEqual({
      ok: false,
      error: { code: "validation", fields: { "": ["tooShort"] } },
    });
  });

  it("maps field messages to { message } objects", () => {
    expect(
      toFieldErrors({ code: "validation", fields: { title: ["required", "tooLong"] } }),
    ).toEqual({ title: [{ message: "required" }, { message: "tooLong" }] });
    expect(toFieldErrors({ code: "conflict" })).toEqual({});
  });
});
