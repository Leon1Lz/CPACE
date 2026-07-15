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

    let identityPhoto: string | undefined
    try {
      const body = await request.json()
      identityPhoto = body.identityPhoto
    } catch {
      // Body is empty or not JSON
    }

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
        identityPhoto,
        status: "IN_PROGRESS",
      },
    })


    return NextResponse.json({ sessionId: examSession.id })
  } catch (error) {
    console.error("Session start error:", error)
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
  }
}

// PATCH — update active session status or flag it (e.g. for browser lock violations)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { sessionId, flagged, flagReason } = await request.json()
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 })

    const examSession = await prisma.examSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: { assessment: { select: { title: true } } }
    })

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found or forbidden" }, { status: 404 })
    }

    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        ...(flagged !== undefined && { flagged }),
        ...(flagReason !== undefined && { flagReason }),
      }
    })

    // If flagged, notify the proctors via Pusher in real-time!
    if (flagged) {
      const { triggerEvent } = await import("@/lib/pusher")
      try {
        await triggerEvent("private-proctor-notifications", "session-flagged", {
          sessionId,
          learnerName: `${user.firstName} ${user.lastName}`,
          assessmentTitle: examSession.assessment.title,
          flagReason,
        })
      } catch (pusherError) {
        console.error("Failed to send real-time flag notification:", pusherError)
      }
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("Session PATCH error:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
