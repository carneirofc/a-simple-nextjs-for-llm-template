import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Label } from "./label";

type TextInputProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hideLabel?: boolean;
};

export function TextInput({ id, label, hideLabel = false, className, ...rest }: TextInputProps) {
  return (
    <>
      <Label className={cn(hideLabel && "sr-only")} htmlFor={id}>
        {label}
      </Label>
      <input
        className={cn(
          "rounded border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive",
          className,
        )}
        id={id}
        {...rest}
      />
    </>
  );
}
