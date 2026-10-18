import { normalizeAuthUrls } from "./lib/auth-url.mjs"

// Vercel runtime instances do not retain next.config's build-time mutations.
// Normalize before NextAuth's session provider is imported during HTML rendering.
export function register() {
  normalizeAuthUrls(process.env)
}
