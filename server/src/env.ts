import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// Load a .env into process.env for local dev (`npm run dev`). Under Docker
// Compose the vars are already injected, so the file is simply absent and this
// is a no-op (dotenv never overrides vars that are already set). We look in the
// server package dir first (where Prisma's CLI also reads its .env) then cwd.
const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: [resolve(here, "../.env"), resolve(process.cwd(), ".env")],
});

// Treat empty-string env vars (common in .env files) as unset.
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

// Validate process env once at boot; fail fast on misconfiguration.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // --- Auth ---
  JWT_SECRET: z.string().min(1).default("dev-insecure-secret-change-me"),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),

  // --- SMTP (optional in dev: if unset, OTPs are logged to the console) ---
  // Empty strings in .env are treated as unset so blank vars don't fail parsing.
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_FROM: z.preprocess(emptyToUndefined, z.string().optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
