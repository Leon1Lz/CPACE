/**
 * lib/env.ts
 *
 * Runtime environment variable validation.
 * Ensures all required environment variables are present at startup.
 * Import this in key server-side entry points to fail fast.
 */

import { z } from "zod"

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL is required — see .env.example" })
    .min(1, "DATABASE_URL must not be empty"),

  // Auth
  NEXTAUTH_SECRET: z
    .string({ required_error: "NEXTAUTH_SECRET is required — generate with: openssl rand -base64 32" })
    .min(1, "NEXTAUTH_SECRET must not be empty"),
  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL")
    .optional()
    .default("http://localhost:3000"),

  // Pusher (optional — the app falls back to polling if not configured)
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional().default(""),
  PUSHER_APP_ID: z.string().optional().default(""),
  PUSHER_SECRET: z.string().optional().default(""),

  // Email (optional — falls back to console logging)
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_SECURE: z.string().optional().default("false"),
  EMAIL_FROM: z.string().optional().default("onboarding@resend.dev"),
  RESEND_API_KEY: z.string().optional().default(""),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Validates and returns parsed server environment variables.
 * Throws a clear error message if required variables are missing.
 */
function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ✗ ${key}: ${msgs?.join(", ")}`)
      .join("\n")

    console.error(
      `\n❌ Invalid environment variables:\n${formatted}\n\n` +
        `→ Copy .env.example to .env and fill in the required values.\n`
    )

    throw new Error("Missing required environment variables. See console output above.")
  }

  return result.data
}

/**
 * Validated server environment.
 * Access this instead of `process.env` for type-safe environment variables.
 */
export const env = validateEnv()
