import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessExamSession } from "@/lib/proctor-access"
import { examChatChannel, getPusherServer } from "@/lib/pusher"

const signalTypes = new Set(["REQUEST", "OFFER", "ANSWER", "ICE", "CLOSE"])

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { sessionId, senderId, targetId, type, payload } = await request.json()
    if (!sessionId || !senderId || !signalTypes.has(type)) {
      return NextResponse.json({ error: "Invalid signal" }, { status: 400 })
    }

    const [user, examSession] = await Promise.all([
      prisma.user.findUnique({ where: { id: authSession.user.id }, select: { id: true, role: true } }),
      prisma.examSession.findUnique({ where: { id: sessionId }, select: { userId: true, status: true } }),
    ])
    if (!user || !examSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })
    const isProctor = user.role === "ADMIN" || user.role === "PROCTOR"
    if (!await canAccessExamSession(user, sessionId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const pusher = getPusherServer()
    if (!pusher) return NextResponse.json({ error: "Realtime video is not configured" }, { status: 503 })

    await pusher.trigger(examChatChannel(sessionId), "webrtc-signal", {
      senderId: String(senderId).slice(0, 100),
      targetId: targetId ? String(targetId).slice(0, 100) : null,
      senderRole: isProctor ? "PROCTOR" : "LEARNER",
      type,
      payload: payload ?? null,
    })
    return NextResponse.json({ delivered: true })
  } catch (error) {
    console.error("WebRTC signaling failed:", error)
    return NextResponse.json({ error: "Signaling failed" }, { status: 500 })
  }
}
