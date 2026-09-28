import type { ComponentProps } from "react";

type TextInputProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hideLabel?: boolean;
};

export function TextInput({
  id,
  label,
  hideLabel = false,
  className = "",
  ...rest
}: TextInputProps) {
  return (
    <>
      <label className={hideLabel ? "sr-only" : "font-medium text-sm"} htmlFor={id}>
        {label}
      </label>
      <input
        className={`rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 ${className}`}
        id={id}
        {...rest}
      />
    </>
  );
}
