import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const handler = NextAuth(authOptions)

export async function POST(req: NextRequest, ctx: any) {
  if (req.nextUrl.pathname.includes("/callback/credentials")) {
    const ip = getClientIp(req)
    // Keep brute-force protection strict in production, while allowing local
    // developers to exercise all seeded role accounts without locking out the
    // shared localhost address.
    const loginAttemptLimit = process.env.NODE_ENV === "production" ? 5 : 50
    const limitResult = rateLimit(`login:${ip}`, loginAttemptLimit, 15 * 60 * 1000)
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((limitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }
  return handler(req, ctx)
}

export async function GET(req: NextRequest, ctx: any) {
  return handler(req, ctx)
}
