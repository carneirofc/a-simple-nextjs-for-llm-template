import { type NextRequest, NextResponse } from "next/server";
import { hasLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getPathLocale, localizePath } from "@/i18n/localize-path";
import { negotiateLocale } from "@/i18n/negotiate";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  return hasLocale(cookie) ? cookie : negotiateLocale(request.headers.get("accept-language"));
}

/**
 * Locale routing: unprefixed URLs redirect to `/<locale>/...` (cookie, then `Accept-Language`);
 * prefixed URLs pass through and remember the locale in a cookie.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const pathLocale = getPathLocale(pathname);

  if (!pathLocale) {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(pathname, preferredLocale(request));
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals and files with an extension (favicon.ico, images, ...).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
