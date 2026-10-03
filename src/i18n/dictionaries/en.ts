/**
 * Source-of-truth dictionary. Every other locale is typed as `Dictionary`, so a missing or extra
 * key fails `pnpm typecheck`. Group keys by screen/feature; use `{name}` placeholders with
 * `interpolate()`.
 */
export const en = {
  metadata: {
    title: "Next.js LLM template",
    description: "Minimal Next.js starter",
  },
  home: {
    hello: "Hello.",
  },
  notes: {
    heading: "Notes",
    form: {
      title: "Title",
      placeholder: "New note",
      add: "Add",
    },
    table: {
      empty: "No notes yet.",
      title: "Title",
      created: "Created",
      status: "Status",
      processing: "Processing…",
      ready: "Ready",
    },
  },
  validation: {
    required: "This field is required",
    tooLong: "This is too long",
  },
  errors: {
    title: "Something went wrong",
    unexpected: "An unexpected error occurred.",
    reference: "Error reference: {digest}",
    retry: "Try again",
  },
  notFound: {
    title: "Page not found",
    home: "Go home",
  },
  localeSwitcher: {
    label: "Language",
  },
};

export type Dictionary = typeof en;

/** Keys usable as Zod error messages; `FieldErrors` translates them via `dictionary.validation`. */
export type ValidationKey = keyof Dictionary["validation"];
