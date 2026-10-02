import type { Locale } from "./config";
import { type Dictionary, en } from "./dictionaries/en";
import { pt } from "./dictionaries/pt";

const dictionaries: Record<Locale, Dictionary> = { en, pt };

/**
 * Synchronous lookup. Server Components should prefer `getDictionary()` from `./server`; this is for
 * the few client components that cannot receive strings as props (e.g. `error.tsx`).
 */
export function getDictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}
