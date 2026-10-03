import * as z from "zod";
import { getNotesService } from "@/features/notes/data";
import { notesListResponseSchema } from "@/features/notes/notes-api-schemas";
import { isEnabled } from "@/lib/flags";
import { jsonWithEtag, problem } from "@/server/http/json-response";

// Public, versioned read endpoint for any client (this app's browser code, mobile, scripts).
// Thin transport: the use case lives in `data.ts`; the wire format in `notes-api-schemas.ts`.

export async function GET(request: Request): Promise<Response> {
  if (!isEnabled("notesExample")) {
    return problem({ code: "notFound" });
  }
  const notes = await (await getNotesService()).list();
  // `encode` also strips fields that are not part of the public contract.
  return jsonWithEtag(request, z.encode(notesListResponseSchema, { items: notes }));
}
