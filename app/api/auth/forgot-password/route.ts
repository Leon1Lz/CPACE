import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const limitResult = rateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000) // Max 3 per 15 minutes
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again in 15 minutes." },
        { status: 429 }
      )
    }

    const { email } = await req.json()
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { email: true, avatar: true },
    })

    // Security practice: Don't reveal if user exists or not.
    // However, if the user doesn't exist, we just return success without doing anything.
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a password reset link has been generated." })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration

    // Delete any old password reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    })

    // Store new token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: tokenHash,
        expiresAt,
      },
    })

    // Send email via Resend
    await sendPasswordResetEmail(user.email, token)

    // If the user has an avatar, they likely signed up via Google — include a helpful hint
    const googleHint = user.avatar
      ? " You can also sign in directly using Google."
      : ""

    return NextResponse.json({
      message: `If an account exists, a password reset link has been generated.${googleHint}`,
    })
  } catch (error) {
    console.error("Forgot password API error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
