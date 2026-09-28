import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/env";
import { isEnabled } from "@/lib/flags";
import { getDb } from "@/server/db/client";
import * as authSchema from "@/server/db/schema/auth";

async function createAuth() {
  const db = await getDb();
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    ...(env.BETTER_AUTH_SECRET ? { secret: env.BETTER_AUTH_SECRET } : {}),
    ...(env.BETTER_AUTH_URL ? { baseURL: env.BETTER_AUTH_URL } : {}),
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID ?? "",
        clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
      },
    },
    plugins: [nextCookies()],
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;

let authPromise: Promise<Auth> | undefined;

/** Returns `null` when the `auth` feature flag is off. Env validation guarantees secrets when on. */
export function getAuth(): Promise<Auth | null> {
  if (!isEnabled("auth")) {
    return Promise.resolve(null);
  }
  authPromise ??= createAuth();
  return authPromise;
}
