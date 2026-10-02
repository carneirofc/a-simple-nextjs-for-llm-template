import { defaultLocale, hasLocale, type Locale } from "./config";

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

function matchTag(tag: string): Locale | undefined {
  const base = tag.split("-")[0];
  return [tag, base].find(hasLocale);
}

/** Picks the best supported locale for an `Accept-Language` header (exact tag, then base language). */
export function negotiateLocale(header: string | null): Locale {
  for (const { tag } of parseAcceptLanguage(header ?? "")) {
    const match = matchTag(tag);
    if (match) {
      return match;
    }
  }
  return defaultLocale;
}
