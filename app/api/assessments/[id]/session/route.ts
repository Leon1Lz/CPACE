import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — called when a learner clicks "Start Exam"
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { id: assessmentId } = await params

    // Close any stale IN_PROGRESS sessions for this user+assessment
    await prisma.examSession.updateMany({
      where: { userId: user.id, assessmentId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED" },
    })

    // Grab IP + User-Agent from headers
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"
    const userAgent = request.headers.get("user-agent") ?? undefined

    const examSession = await prisma.examSession.create({
      data: {
        userId: user.id,
        assessmentId,
        ipAddress,
        userAgent,
        status: "IN_PROGRESS",
      },
    })

    return NextResponse.json({ sessionId: examSession.id })
  } catch (error) {
    console.error("Session start error:", error)
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
  }
}
