/** Fills `{name}` placeholders: `interpolate("Hi {name}", { name: "Ada" })` → `"Hi Ada"`. Unknown keys stay as-is. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
