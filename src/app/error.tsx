"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** Next 16: re-fetches and re-renders the segment (`reset` only clears state). */
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 p-8">
      <h1 className="font-semibold text-2xl">Something went wrong</h1>
      <p className="text-muted-foreground">
        {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
