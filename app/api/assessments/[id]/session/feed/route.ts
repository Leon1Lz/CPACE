import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { triggerEvent } from "@/lib/pusher"
import { setLiveSnapshot } from "@/lib/exam-live-store"
import { isSafeImageDataUrl } from "@/lib/authorization"

// POST /api/assessments/[id]/session/feed
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { id: assessmentId } = await params
    const body = await request.json()
    const { sessionId, snapshot, cameraStatus = "CONNECTED", detectorStatus = "ACTIVE" } = body

    if (!sessionId || !snapshot) {
      return NextResponse.json({ error: "Missing sessionId or snapshot" }, { status: 400 })
    }
    if (!isSafeImageDataUrl(snapshot, 512 * 1024)) {
      return NextResponse.json({ error: "Snapshot must be a JPEG or PNG no larger than 512 KB" }, { status: 413 })
    }

    // Verify session belongs to user and is IN_PROGRESS
    const examSession = await prisma.examSession.findFirst({
      where: { id: sessionId, userId: user.id, assessmentId, status: "IN_PROGRESS" }
    })
    if (!examSession) {
      return NextResponse.json({ error: "Invalid active session" }, { status: 403 })
    }

    // Push the snapshot to the proctors viewing this session in real-time
    setLiveSnapshot(sessionId, snapshot)
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        lastHeartbeatAt: new Date(),
        cameraStatus: String(cameraStatus).slice(0, 30),
        detectorStatus: String(detectorStatus).slice(0, 30),
      },
    })
    const channelName = `private-exam-session-${sessionId}`
    await triggerEvent(channelName, "webcam-snapshot", { snapshot })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Live feed snapshot trigger error:", error)
    return NextResponse.json({ error: "Failed to push live snapshot" }, { status: 500 })
  }
}
