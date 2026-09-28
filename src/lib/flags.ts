import * as z from "zod";
import { env } from "@/env";

/**
 * Feature toggles. Add a key here + a `FEATURE_*` variable in `src/env.ts`.
 * Server-side only: pass resolved values to client components as props.
 */
export const flagsSchema = z.object({
  auth: z.boolean(),
  notesExample: z.boolean(),
});

export type Flags = z.infer<typeof flagsSchema>;
export type FlagName = keyof Flags;

export const flags: Flags = flagsSchema.parse({
  auth: env.FEATURE_AUTH,
  notesExample: env.FEATURE_NOTES_EXAMPLE,
});

export function isEnabled(name: FlagName): boolean {
  return flags[name];
}
