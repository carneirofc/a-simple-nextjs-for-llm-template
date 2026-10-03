import { describe, expect, it } from "vitest";
import * as z from "zod";
import { combineRealtimeEvents, defineRealtimeEvents } from "./realtime";

const things = defineRealtimeEvents(z.object({ type: z.literal("thing.changed") }), () => [
  ["things"],
]);
const others = defineRealtimeEvents(z.object({ type: z.literal("other.changed") }), () => [
  ["others"],
]);

describe("realtime events", () => {
  it("returns the query keys for a matching event", () => {
    expect(things({ type: "thing.changed" })).toEqual([["things"]]);
  });

  it("returns null for unknown or malformed payloads", () => {
    expect(things({ type: "nope" })).toBeNull();
    expect(things(undefined)).toBeNull();
  });

  it("combines feature matchers", () => {
    const match = combineRealtimeEvents([things, others]);
    expect(match({ type: "other.changed" })).toEqual([["others"]]);
    expect(match({ type: "internal.only" })).toBeNull();
  });
});
