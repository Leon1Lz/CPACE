import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Security practice: Don't reveal if user exists or not.
    // However, if the user doesn't exist, we just return success without doing anything.
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a password reset link has been generated." })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration

    // Delete any old password reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    })

    // Store new token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    })

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`

    // Print to console for easy developer access
    console.log(`\n==========================================`)
    console.log(`🔑 PASSWORD RESET LINK REQUESTED FOR: ${user.email}`)
    console.log(`👉 Link: ${resetUrl}`)
    console.log(`==========================================\n`)

    return NextResponse.json({
      message: "If an account exists, a password reset link has been generated.",
      debugUrl: resetUrl,
    })
  } catch (error) {
    console.error("Forgot password API error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
