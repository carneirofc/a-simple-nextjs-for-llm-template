import * as z from "zod";

/** Supported locales. The first entry is the default. Add one here + a dictionary in `dictionaries/`. */
export const locales = ["en", "pt"] as const;

export const localeSchema = z.enum(locales);

export type Locale = z.infer<typeof localeSchema>;

export const defaultLocale: Locale = locales[0];

/** Each locale's name in its own language (for the switcher). */
export const localeNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

/** Remembers the user's explicit choice; read by `src/proxy.ts`. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: string | undefined): value is Locale {
  return localeSchema.safeParse(value).success;
}
