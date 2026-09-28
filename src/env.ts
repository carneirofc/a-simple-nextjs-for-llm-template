import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

const flag = (defaultValue: boolean) => z.stringbool().default(defaultValue);

/**
 * Single source of truth for environment variables. Never read `process.env` elsewhere.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url().optional(),

    FEATURE_AUTH: flag(false),
    FEATURE_NOTES_EXAMPLE: flag(true),

    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.url().optional(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  createFinalSchema: (shape) =>
    z.object(shape).superRefine((values, ctx) => {
      if (!values.FEATURE_AUTH) {
        return;
      }
      const required = [
        "BETTER_AUTH_SECRET",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
      ] as const satisfies readonly (keyof typeof values)[];
      for (const key of required) {
        if (!values[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when FEATURE_AUTH=true`,
          });
        }
      }
    }),
});
