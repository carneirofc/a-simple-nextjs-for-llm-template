import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connection } from "next/server";
import { getNotes } from "@/features/notes/data";
import { NotesPanel } from "@/features/notes/notes-panel";
import { notesQueryOptions } from "@/features/notes/queries";
import { isEnabled } from "@/lib/flags";
import { getQueryClient } from "@/lib/query-client";

export default async function HomePage() {
  // Render per request (SSR) — the page reads the database.
  await connection();

  if (!isEnabled("notesExample")) {
    return <main className="mx-auto w-full max-w-2xl p-8">Hello.</main>;
  }

  const queryClient = getQueryClient();
  // Same query key as the client, but read the DB directly (server actions can't run during render).
  await queryClient.prefetchQuery({ ...notesQueryOptions, queryFn: getNotes });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="font-semibold text-2xl">Notes</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NotesPanel />
      </HydrationBoundary>
    </main>
  );
}
