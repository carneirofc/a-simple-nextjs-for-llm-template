import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

export function Label({ className = "", ...rest }: LabelProps) {
  return <LabelPrimitive.Root className={`font-medium text-sm ${className}`} {...rest} />;
}
