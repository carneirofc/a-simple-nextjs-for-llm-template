import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { getNotes } from "@/features/notes/data";
import { NotesPanel } from "@/features/notes/notes-panel";
import { notesQueryOptions } from "@/features/notes/queries";
import { getDictionary, getLocale } from "@/i18n/server";
import { isEnabled } from "@/lib/flags";
import { getQueryClient } from "@/lib/query-client";

export default async function HomePage() {
  // Render per request (SSR) — the page reads the database.
  await connection();
  const [locale, dictionary] = await Promise.all([getLocale(), getDictionary()]);

  if (!isEnabled("notesExample")) {
    return <main className="mx-auto w-full max-w-2xl p-8">{dictionary.home.hello}</main>;
  }

  const queryClient = getQueryClient();
  // Same query key as the client, but read the DB directly (server actions can't run during render).
  // `fetchQuery` (not `prefetchQuery`) so a failure reaches `error.tsx` instead of being swallowed
  // and resurfacing as a misleading "Server Functions cannot be called during initial render".
  await queryClient.fetchQuery({ ...notesQueryOptions, queryFn: getNotes });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="font-semibold text-2xl">{dictionary.notes.heading}</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NotesPanel labels={dictionary.notes} locale={locale} validation={dictionary.validation} />
      </HydrationBoundary>
    </main>
  );
}
