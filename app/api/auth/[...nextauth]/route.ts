import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const handler = NextAuth(authOptions)

export async function POST(req: NextRequest, ctx: any) {
  if (req.nextUrl.pathname.includes("/callback/credentials")) {
    const ip = getClientIp(req)
    const limitResult = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000) // 5 requests per 15 mins
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
