type FieldErrorsProps = {
  errors: readonly ({ message?: string } | undefined)[];
  /** Translations keyed by error message (e.g. `dictionary.validation`); unknown messages show as-is. */
  messages?: Readonly<Record<string, string>>;
};

export function FieldErrors({ errors, messages = {} }: FieldErrorsProps) {
  const texts = errors.flatMap((error) =>
    error?.message
      ? [Object.hasOwn(messages, error.message) ? messages[error.message] : error.message]
      : [],
  );
  return [...new Set(texts)].map((text) => (
    <p className="text-destructive text-sm" key={text} role="alert">
      {text}
    </p>
  ));
}
