import type { ComponentProps } from "react";

const VARIANT_CLASSES = {
  primary: "bg-foreground text-background",
  ghost: "border border-zinc-300 dark:border-zinc-700",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT_CLASSES;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded px-4 py-2 disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      type={type}
      {...rest}
    />
  );
}
