import { describe, expect, it } from "vitest";
import { domainEventSchema, mergeEventHandlers } from "./domain-event";

describe("domainEventSchema", () => {
  it("keeps extra fields and requires a type", () => {
    expect(domainEventSchema.parse({ type: "a.b", id: "1" })).toEqual({ type: "a.b", id: "1" });
    expect(domainEventSchema.safeParse({ id: "1" }).success).toBe(false);
  });
});

describe("mergeEventHandlers", () => {
  it("concatenates handlers registered for the same type", () => {
    const first = () => Promise.resolve();
    const second = () => Promise.resolve();

    expect(mergeEventHandlers({ a: [first] }, { a: [second], b: [first] })).toEqual({
      a: [first, second],
      b: [first],
    });
  });
});
