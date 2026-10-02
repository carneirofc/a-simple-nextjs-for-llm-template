"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** Next 16: re-fetches and re-renders the segment (`reset` only clears state). */
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const { lang } = useParams<{ lang: string }>();
  const { errors } = getDictionaryFor(hasLocale(lang) ? lang : defaultLocale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 p-8">
      <h1 className="font-semibold text-2xl">{errors.title}</h1>
      <p className="text-muted-foreground">
        {error.digest ? interpolate(errors.reference, { digest: error.digest }) : errors.unexpected}
      </p>
      <Button onClick={() => retry()}>{errors.retry}</Button>
    </main>
  );
}
