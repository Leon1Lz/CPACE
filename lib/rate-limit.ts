/**
 * lib/rate-limit.ts
 *
 * Lightweight, in-memory sliding window rate limiter.
 * Ideal for protecting sensitive auth endpoints (login, password reset) from brute force attacks
 * without requiring Redis or extra database infrastructure.
 */

const tracker = new Map<string, number[]>()

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
 * Extract client IP helper from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return "127.0.0.1"
}
