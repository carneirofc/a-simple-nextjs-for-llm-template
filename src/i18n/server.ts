import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import { getDictionaryFor } from "./dictionaries";
import type { Dictionary } from "./dictionaries/en";

/** Current request locale from the `[lang]` root segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) {
    notFound();
  }
  return value;
}

/** Dictionary for the current request. Server Components only; pass slices to client components. */
export async function getDictionary(): Promise<Dictionary> {
  return getDictionaryFor(await getLocale());
}
