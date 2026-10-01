import type { ComponentProps } from "react";
import { Label } from "./label";

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
      <Label className={hideLabel ? "sr-only" : ""} htmlFor={id}>
        {label}
      </Label>
      <input
        className={`rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 ${className}`}
        id={id}
        {...rest}
      />
    </>
  );
}
