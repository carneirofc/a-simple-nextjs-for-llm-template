import { defaultShouldDehydrateQuery, isServer, QueryClient } from "@tanstack/react-query";
import { cache } from "react";

const STALE_TIME_MS = 60_000;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid refetching immediately on the client after SSR hydration.
        staleTime: STALE_TIME_MS,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

// One client per server request: React `cache()` memoizes for the duration of a Server Component
// render (layout and page share it) and never across requests.
const getRequestQueryClient = cache(makeQueryClient);

let browserQueryClient: QueryClient | undefined;

/** Server: one client per request. Browser: one shared client. */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return getRequestQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
