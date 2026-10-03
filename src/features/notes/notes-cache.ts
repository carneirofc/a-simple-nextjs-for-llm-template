// Cache contract: every identity for notes data, shared by server and client (no server-only or
// client-only imports). Server cache tags (`cacheTag`/`updateTag`) go here once `cacheComponents`
// is enabled; see docs/architecture/caching.md.

const all = ["notes"] as const;

export const notesCache = {
  key: {
    /** Prefix of every notes query: invalidate this after any notes write. */
    all,
    list: () => [...all, "list"] as const,
  },
};
