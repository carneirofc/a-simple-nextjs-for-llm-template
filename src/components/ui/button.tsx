import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const VARIANT_CLASSES = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  ghost: "border border-border hover:bg-foreground/5",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT_CLASSES;
  /** Render the single child (e.g. a `Link`) with button styles instead of a `<button>`. */
  asChild?: boolean;
};

export function Button({
  variant = "primary",
  asChild = false,
  className,
  type,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE_CLASSES, VARIANT_CLASSES[variant], className);

  if (asChild) {
    return <Slot.Root className={classes} {...rest} />;
  }

  return <button className={classes} type={type ?? "button"} {...rest} />;
}
