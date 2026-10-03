import "server-only";
import { type ActionResult, ok, validationFailure } from "@/lib/action-result";
import { isEnabled } from "@/lib/flags";
import { type Container, getContainer } from "@/server/container";
import type { Note } from "@/server/db/schema/notes";
import { noteInputSchema } from "./notes-schema";

// Use cases. Every transport (Server Components, actions, `/api/v1` route handlers) calls these, so
// feature-flag checks, validation and (when needed) authorization live here once.

export type NotesDeps = Pick<Container, "notesRepo">;

function assertEnabled(): void {
  if (!isEnabled("notesExample")) {
    throw new Error("Feature disabled: notesExample");
  }
}

export function createNotesService({ notesRepo }: NotesDeps) {
  return {
    list: (): Promise<Note[]> => {
      assertEnabled();
      return notesRepo.list();
    },
    /** `input` is untrusted (actions are public endpoints); invalid input is an expected failure. */
    create: async (input: unknown): Promise<ActionResult<Note>> => {
      assertEnabled();
      const parsed = noteInputSchema.safeParse(input);
      if (!parsed.success) {
        return validationFailure(parsed.error);
      }
      return ok(await notesRepo.insert(parsed.data));
    },
  };
}

export async function getNotesService() {
  return createNotesService(await getContainer());
}

/** Server Component entry point (SSR prefetch). */
export async function getNotes(): Promise<Note[]> {
  return (await getNotesService()).list();
}
