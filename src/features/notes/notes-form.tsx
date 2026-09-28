"use client";

import { useForm } from "@tanstack/react-form";
import { type NewNote, noteInsertSchema } from "@/server/db/schema/notes";

type NotesFormProps = {
  onSubmit: (value: NewNote) => Promise<unknown>;
};

const DEFAULT_VALUES: NewNote = { title: "" };

export function NotesForm({ onSubmit }: NotesFormProps) {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onSubmit: noteInsertSchema },
    onSubmit: async ({ value, formApi }) => {
      await onSubmit(noteInsertSchema.parse(value));
      formApi.reset();
    },
  });

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <div className="flex flex-1 flex-col gap-1">
            <label className="sr-only" htmlFor={field.name}>
              Title
            </label>
            <input
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="New note"
              value={field.state.value}
            />
            {field.state.meta.errors.map((error) => (
              <p className="text-red-600 text-sm" key={error?.message} role="alert">
                {error?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <button
            className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            Add
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
