type FieldErrorsProps = {
  errors: readonly ({ message?: string } | undefined)[];
};

export function FieldErrors({ errors }: FieldErrorsProps) {
  const messages = [...new Set(errors.map((error) => error?.message).filter(Boolean))];
  return messages.map((message) => (
    <p className="text-destructive text-sm" key={message} role="alert">
      {message}
    </p>
  ));
}
