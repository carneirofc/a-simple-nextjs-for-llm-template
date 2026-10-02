import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

export function Label({ className, ...rest }: LabelProps) {
  return <LabelPrimitive.Root className={cn("font-medium text-sm", className)} {...rest} />;
}
