import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { triggerEvent } from "@/lib/pusher"
import { setLiveSnapshot } from "@/lib/exam-live-store"
import { isSafeImageDataUrl } from "@/lib/authorization"
import { MAX_LIVE_SNAPSHOT_BYTES } from "@/lib/exam-live-snapshot"

const feedSchema = z.object({
  sessionId: z.string().min(1).max(100),
  snapshot: z.string().optional(),
  cameraStatus: z.enum(["CONNECTED", "DISCONNECTED", "STARTING", "ERROR"]).default("CONNECTED"),
  detectorStatus: z.enum(["ACTIVE", "STARTING", "LOADING", "ERROR", "DISABLED"]).default("ACTIVE"),
}).strict()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const { id: assessmentId } = await params
    const { sessionId, snapshot, cameraStatus, detectorStatus } = feedSchema.parse(await request.json())

    if (snapshot !== undefined) {
      // Size and content failures are distinct; tiny live JPEGs are legitimate.
      const encoded = /^data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(snapshot)?.[1]
      const padding = encoded?.endsWith("==") ? 2 : encoded?.endsWith("=") ? 1 : 0
      const bytes = encoded ? Math.floor(encoded.length * 3 / 4) - padding : 0
      if (snapshot.length > Math.ceil(MAX_LIVE_SNAPSHOT_BYTES / 3) * 4 + 23 || bytes > MAX_LIVE_SNAPSHOT_BYTES) {
        return NextResponse.json({ error: "Snapshot exceeds the 512 KB limit" }, { status: 413 })
      }
      if (!isSafeImageDataUrl(snapshot, MAX_LIVE_SNAPSHOT_BYTES, 64)) {
        return NextResponse.json({ error: "Snapshot must contain a valid JPEG or PNG frame" }, { status: 400 })
      }
    }
    if (cameraStatus === "CONNECTED" && !snapshot) {
      return NextResponse.json({ error: "A connected camera must include a video frame" }, { status: 400 })
    }

    // Health-only heartbeats report disconnected/loading devices without fabricating a frame.
    const updated = await prisma.examSession.updateMany({
      where: { id: sessionId, userId: user.id, assessmentId, status: "IN_PROGRESS" },
      data: { lastHeartbeatAt: new Date(), cameraStatus, detectorStatus },
    })
    if (updated.count !== 1) return NextResponse.json({ error: "Invalid active session" }, { status: 403 })

    if (snapshot && cameraStatus === "CONNECTED") {
      setLiveSnapshot(sessionId, snapshot)
      await triggerEvent("private-exam-session-" + sessionId, "webcam-snapshot", { snapshot })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid live feed request" }, { status: 400 })
    }
    console.error("Live feed heartbeat failed")
    return NextResponse.json({ error: "Failed to update live feed" }, { status: 500 })
  }
}
