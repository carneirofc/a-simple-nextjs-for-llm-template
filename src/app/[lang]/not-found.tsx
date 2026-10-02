import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function NotFound() {
  const [locale, { notFound }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 p-8">
      <h1 className="font-semibold text-2xl">{notFound.title}</h1>
      <Button asChild={true} variant="ghost">
        <Link href={`/${locale}`}>{notFound.home}</Link>
      </Button>
    </main>
  );
}
