"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import { TextInput } from "@/components/ui/text-input";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { type NewNote, noteInsertSchema } from "@/server/db/schema/notes";

type NotesFormProps = {
  onSubmit: (value: NewNote) => Promise<unknown>;
  labels: Dictionary["notes"]["form"];
  validation: Dictionary["validation"];
};

const DEFAULT_VALUES: NewNote = { title: "" };

export function NotesForm({ onSubmit, labels, validation }: NotesFormProps) {
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
