import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProctorSessionScope } from "@/lib/proctor-access"
import { getAllLiveSnapshots } from "@/lib/exam-live-store"
import { pruneExpiredProctoringEvidence } from "@/lib/proctoring-retention"

export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const viewer = await prisma.user.findUnique({ where: { id: authSession.user.id } })
    if (!viewer || (viewer.role !== "ADMIN" && viewer.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const requested = request.nextUrl.searchParams.get("ids")
    const ids = requested === null ? null : requested.split(",").filter(Boolean)
    if (ids && (ids.length > 48 || ids.some(id => id.length > 100))) return NextResponse.json({ error: "At most 48 camera tiles per request" }, { status: 400 })
    const healthOnly = request.nextUrl.searchParams.get("healthOnly") === "true"

    await pruneExpiredProctoringEvidence()

    const activeSessions = await prisma.examSession.findMany({
      where: { status: "IN_PROGRESS", AND: [await getProctorSessionScope(viewer)] },
      select: { id: true, lastHeartbeatAt: true, cameraStatus: true, detectorStatus: true },
    })
    const activeIds = new Set(activeSessions.map((session) => session.id))
    const frames = Object.fromEntries(
      Object.entries(healthOnly ? {} : getAllLiveSnapshots()).filter(([sessionId]) => activeIds.has(sessionId) && (!ids || ids.includes(sessionId))),
    )

    return NextResponse.json({ frames, health: Object.fromEntries(activeSessions.map(session => [session.id, {
      lastHeartbeatAt: session.lastHeartbeatAt, cameraStatus: session.cameraStatus, detectorStatus: session.detectorStatus,
    }])) }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Proctor gallery feed error:", error)
    return NextResponse.json({ error: "Failed to load camera gallery" }, { status: 500 })
  }
}
