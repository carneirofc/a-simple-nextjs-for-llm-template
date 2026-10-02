import { defaultLocale, type Locale, locales } from "./config";

type Preference = { tag: string; quality: number };

function parseAcceptLanguage(header: string): Preference[] {
  return header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), quality: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((pref) => pref.tag !== "" && pref.tag !== "*" && pref.quality > 0)
    .sort((a, b) => b.quality - a.quality);
}

const baseLanguage = (tag: string) => tag.toLowerCase().split("-")[0];

/** Exact tag (case-insensitive), else the first supported locale sharing the base language. */
function matchTag(tag: string): Locale | undefined {
  return (
    locales.find((locale) => locale.toLowerCase() === tag) ??
    locales.find((locale) => baseLanguage(locale) === baseLanguage(tag))
  );
}

/** Picks the best supported locale for an `Accept-Language` header. */
export function negotiateLocale(header: string | null): Locale {
  for (const { tag } of parseAcceptLanguage(header ?? "")) {
    const match = matchTag(tag);
    if (match) {
      return match;
    }
  }
  return defaultLocale;
}
