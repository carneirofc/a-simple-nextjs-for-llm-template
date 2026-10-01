import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

const VARIANT_CLASSES = {
  primary: "bg-foreground text-background",
  ghost: "border border-zinc-300 dark:border-zinc-700",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT_CLASSES;
  /** Render the single child (e.g. a `Link`) with button styles instead of a `<button>`. */
  asChild?: boolean;
};

export function Button({
  variant = "primary",
  asChild = false,
  className = "",
  type,
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded px-4 py-2 disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`;

  if (asChild) {
    return <Slot.Root className={classes} {...rest} />;
  }

  return <button className={classes} type={type ?? "button"} {...rest} />;
}
