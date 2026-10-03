import type { Metadata } from "next";
import "../globals.css";
import { locales } from "@/i18n/config";
import { LocaleSwitcher } from "@/i18n/locale-switcher";
import { getDictionary, getLocale } from "@/i18n/server";
import { isEnabled } from "@/lib/flags";
import { RealtimeListener } from "../_events/realtime-listener";
import { Providers } from "../providers";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();
  return { title: metadata.title, description: metadata.description };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [locale, dictionary] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <html className="h-full antialiased" lang={locale}>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-2xl justify-end px-8 pt-4">
          <LocaleSwitcher current={locale} label={dictionary.localeSwitcher.label} />
        </header>
        <Providers>
          {isEnabled("realtime") ? <RealtimeListener /> : null}
          {children}
        </Providers>
      </body>
    </html>
  );
}
