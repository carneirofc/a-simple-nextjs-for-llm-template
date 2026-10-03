import * as z from "zod";

/**
 * Expected failures the caller can act on. Unexpected failures (bugs, outages) are thrown instead.
 * `fields` holds error messages per field; they are `ValidationKey`s the UI translates.
 */
export const actionErrorSchema = z.object({
  code: z.enum(["validation", "notFound", "conflict", "forbidden"]),
  fields: z.record(z.string(), z.array(z.string())).optional(),
});

export type ActionError = z.infer<typeof actionErrorSchema>;

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: ActionError): ActionResult<never> {
  return { ok: false, error };
}

/** Converts a Zod error into a `validation` failure with messages grouped by top-level field. */
export function validationFailure(error: z.ZodError): ActionResult<never> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    fields[field] = [...(fields[field] ?? []), issue.message];
  }
  return fail({ code: "validation", fields });
}

/** Field errors in the `{ message }` shape form libraries and `FieldErrors` expect. */
export function toFieldErrors(error: ActionError): Record<string, { message: string }[]> {
  return Object.fromEntries(
    Object.entries(error.fields ?? {}).map(([field, messages]) => [
      field,
      messages.map((message) => ({ message })),
    ]),
  );
}
