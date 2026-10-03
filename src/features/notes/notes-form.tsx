"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import { TextInput } from "@/components/ui/text-input";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { type ActionResult, toFieldErrors } from "@/lib/action-result";
import { type NoteInput, noteInputSchema } from "./notes-schema";

type NotesFormProps = {
  /** Resolves to the action result; server-side field errors are shown on the matching fields. */
  onSubmit: (value: NoteInput) => Promise<ActionResult<unknown>>;
  labels: Dictionary["notes"]["form"];
  validation: Dictionary["validation"];
};

const DEFAULT_VALUES: NoteInput = { title: "" };

export function NotesForm({ onSubmit, labels, validation }: NotesFormProps) {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onSubmit: noteInputSchema },
    onSubmit: async ({ value, formApi }) => {
      const result = await onSubmit(noteInputSchema.parse(value));
      if (result.ok) {
        formApi.reset();
        return;
      }
      formApi.setErrorMap({ onSubmit: { fields: toFieldErrors(result.error) } });
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
            <TextInput
              aria-invalid={field.state.meta.errors.length > 0}
              hideLabel={true}
              id={field.name}
              label={labels.title}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder={labels.placeholder}
              value={field.state.value}
            />
            <FieldErrors errors={field.state.meta.errors} messages={validation} />
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button disabled={isSubmitting} type="submit">
            {labels.add}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
