type FieldErrorsProps = {
  errors: readonly ({ message?: string } | undefined)[];
};

export function FieldErrors({ errors }: FieldErrorsProps) {
  return errors.map((error) => (
    <p className="text-red-600 text-sm" key={error?.message} role="alert">
      {error?.message}
    </p>
  ));
}
