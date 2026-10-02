"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { type Locale, localeNames, locales } from "./config";
import { localizePath } from "./localize-path";

type LocaleSwitcherProps = {
  current: Locale;
  label: string;
};

/** Plain links (full navigation) so the proxy stores the choice in the locale cookie. */
export function LocaleSwitcher({ current, label }: LocaleSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex gap-3 text-sm">
      {locales.map((locale) => (
        <a
          aria-current={locale === current ? "true" : undefined}
          className={cn(
            "rounded underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
            locale === current ? "font-semibold" : "text-muted-foreground",
          )}
          href={localizePath(pathname, locale)}
          hrefLang={locale}
          key={locale}
          lang={locale}
        >
          {localeNames[locale]}
        </a>
      ))}
    </nav>
  );
}
