import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { env } from "@/env";
import * as authSchema from "./schema/auth";
import * as notesSchema from "./schema/notes";
import * as outboxSchema from "./schema/outbox";

export const schema = { ...authSchema, ...notesSchema, ...outboxSchema };

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS_FOLDER = "./drizzle";
const PGLITE_DATA_DIR = "./.data/pglite";

async function createPostgres(url: string): Promise<Database> {
  const [{ drizzle }, { default: postgres }] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("postgres"),
  ]);
  return drizzle(postgres(url), { schema, casing: "snake_case" });
}

/** Dev/test only: embedded Postgres (WASM), migrated on first use. */
async function createPglite(): Promise<Database> {
  const [{ mkdir }, { PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("node:fs/promises"),
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  // PGlite does not create missing parent directories.
  await mkdir(PGLITE_DATA_DIR, { recursive: true });
  const db = drizzle(new PGlite(PGLITE_DATA_DIR), { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

function createDatabase(): Promise<Database> {
  if (env.DATABASE_URL) {
    return createPostgres(env.DATABASE_URL);
  }
  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
  return createPglite();
}

// Survive dev hot reloads: PGlite allows a single open instance per data dir.
const globalForDb = globalThis as typeof globalThis & { dbPromise?: Promise<Database> | undefined };

/** Lazily connects on first call, so importing this module never touches the database. */
export function getDb(): Promise<Database> {
  globalForDb.dbPromise ??= createDatabase().catch((error: unknown) => {
    // Don't cache failures; the next call retries.
    globalForDb.dbPromise = undefined;
    throw error;
  });
  return globalForDb.dbPromise;
}
