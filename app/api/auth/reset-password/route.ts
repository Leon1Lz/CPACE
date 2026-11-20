import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { validatePassword, PASSWORD_COMPLEXITY_MESSAGE } from "@/lib/password-validator"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (typeof token !== "string" || token.length !== 64 || !/^[a-f0-9]+$/i.test(token) || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    const validation = validatePassword(password)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors[0] || PASSWORD_COMPLEXITY_MESSAGE }, { status: 400 })
    }

    // Find and validate the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: crypto.createHash("sha256").update(token).digest("hex") },
    })

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check expiration
    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      })
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Change the password, revoke every existing JWT for the account, and
    // consume the reset token atomically.
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword, activeSessionToken: null },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ])

    return NextResponse.json({ message: "Password has been reset successfully." })
  } catch (error) {
    console.error("Reset password API error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
