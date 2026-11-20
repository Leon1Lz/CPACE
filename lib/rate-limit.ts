/**
 * lib/rate-limit.ts
 *
 * Rate limiting helpers. `rateLimit` remains available for isolated unit tests;
 * request handlers should use `rateLimitDistributed` so limits are shared by
 * all application instances.
 */

import { createHash } from "node:crypto"

const tracker = new Map<string, number[]>()
let lastDistributedCleanupAt = 0

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof global !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, timestamps] of tracker.entries()) {
      const active = timestamps.filter((t) => t > now - 15 * 60 * 1000) // Keep max 15 mins history
      if (active.length === 0) {
        tracker.delete(ip)
      } else {
        tracker.set(ip, active)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitResponse {
  success: boolean
  remaining: number
  limit: number
  reset: number
}

/**
 * Check if a client IP has exceeded the limit.
 *
 * @param key Unique key (typically client IP + route name)
 * @param limit Max allowed requests within the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResponse {
  const now = Date.now()
  const windowStart = now - windowMs

  let timestamps = tracker.get(key) || []

  // Filter out timestamps outside the active window
  timestamps = timestamps.filter((t) => t > windowStart)

  if (timestamps.length >= limit) {
    const oldestTimestamp = timestamps[0]
    const resetTime = oldestTimestamp + windowMs
    return {
      success: false,
      remaining: 0,
      limit,
      reset: resetTime,
    }
  }

  timestamps.push(now)
  tracker.set(key, timestamps)

  return {
    success: true,
    remaining: limit - timestamps.length,
    limit,
    reset: now + windowMs,
  }
}

/**
 * Atomically enforce a fixed-window limit in PostgreSQL. The raw client key is
 * hashed before storage so IP addresses are not retained in this table.
 * Fails closed if the shared store is unavailable.
 */
export async function rateLimitDistributed(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResponse> {
  const now = Date.now()
  const keyHash = createHash("sha256").update(key).digest("hex")

  try {
    const { prisma } = await import("@/lib/prisma")
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      INSERT INTO "rate_limit_buckets" ("keyHash", "count", "resetAt")
      VALUES (${keyHash}, 1, NOW() + (${windowMs} * INTERVAL '1 millisecond'))
      ON CONFLICT ("keyHash") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_buckets"."resetAt" <= NOW() THEN 1
          ELSE "rate_limit_buckets"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "rate_limit_buckets"."resetAt" <= NOW() THEN EXCLUDED."resetAt"
          ELSE "rate_limit_buckets"."resetAt"
        END
      RETURNING "count", "resetAt"
    `

    if (!rows[0]) throw new Error("Rate-limit store returned no bucket")

    if (now - lastDistributedCleanupAt > 60 * 60 * 1000) {
      lastDistributedCleanupAt = now
      void prisma.$executeRaw`
        DELETE FROM "rate_limit_buckets"
        WHERE "resetAt" < NOW() - INTERVAL '1 day'
      `.catch((error) => console.error("Rate-limit cleanup failed:", error))
    }

    const reset = rows[0].resetAt.getTime()
    const success = rows[0].count <= limit
    return {
      success,
      remaining: Math.max(0, limit - rows[0].count),
      limit,
      reset,
    }
  } catch (error) {
    console.error("Distributed rate-limit check failed:", error)
    return { success: false, remaining: 0, limit, reset: now + windowMs }
  }
}

/**
 * Extract client IP helper from request headers.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return "127.0.0.1"
}
