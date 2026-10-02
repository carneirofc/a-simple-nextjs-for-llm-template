import { hasLocale, type Locale } from "./config";

/** The locale prefix of a pathname (`/pt/notes` → `"pt"`), if any. */
export function getPathLocale(pathname: string): Locale | undefined {
  const segment = pathname.split("/")[1];
  return hasLocale(segment) ? segment : undefined;
}

/** Points a pathname at `locale`, replacing an existing locale prefix or adding one. */
export function localizePath(pathname: string, locale: Locale): `/${Locale}${string}` {
  const rest = getPathLocale(pathname) ? pathname.slice(pathname.indexOf("/", 1)) : pathname;
  const suffix = rest === "/" || !rest.startsWith("/") ? "" : rest;
  return `/${locale}${suffix}`;
}
