import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessExamSession } from "@/lib/proctor-access"
import { examChatChannel, getPusherServer } from "@/lib/pusher"

const signalType = z.enum(["REQUEST", "OFFER", "ANSWER", "ICE", "CLOSE"])
const signalSchema = z.object({
  sessionId: z.string().min(1).max(100),
  senderId: z.string().min(1).max(100),
  targetId: z.string().min(1).max(100).nullable().default(null),
  type: signalType,
  payload: z.unknown().nullable().optional(),
}).strict()

async function authorizedParticipant(sessionId: string, userId: string) {
  const [user, examSession] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
    prisma.examSession.findUnique({ where: { id: sessionId }, select: { userId: true, status: true } }),
  ])
  if (!user || !examSession || examSession.status !== "IN_PROGRESS") return null
  if (!await canAccessExamSession(user, sessionId)) return null
  return { senderRole: user.role === "ADMIN" || user.role === "PROCTOR" ? "PROCTOR" as const : "LEARNER" as const }
}

// Poll short-lived negotiation messages when Pusher is not configured. Camera
// media never passes through this endpoint; the WebRTC stream stays peer-to-peer.
export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sessionId = request.nextUrl.searchParams.get("sessionId") ?? ""
    const clientId = request.nextUrl.searchParams.get("clientId") ?? ""
    const sinceValue = request.nextUrl.searchParams.get("since")
    if (!sessionId || sessionId.length > 100 || !clientId || clientId.length > 100) {
      return NextResponse.json({ error: "Invalid polling request" }, { status: 400 })
    }
    const since = sinceValue ? new Date(sinceValue) : new Date(Date.now() - 10_000)
    if (Number.isNaN(since.getTime()) || Date.now() - since.getTime() > 10 * 60_000) {
      return NextResponse.json({ error: "Invalid polling cursor" }, { status: 400 })
    }

    const participant = await authorizedParticipant(sessionId, authSession.user.id)
    if (!participant) return NextResponse.json({ error: "Session not active or access denied" }, { status: 403 })

    const signals = await prisma.webRtcSignal.findMany({
      where: {
        sessionId,
        createdAt: { gte: since },
        senderRole: participant.senderRole === "PROCTOR" ? "LEARNER" : "PROCTOR",
        ...(participant.senderRole === "PROCTOR"
          ? { targetId: clientId }
          : { OR: [{ targetId: clientId }, { targetId: null }] }),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    })

    return NextResponse.json({
      signals: signals.map((signal) => ({
        id: signal.id,
        senderId: signal.senderId,
        targetId: signal.targetId,
        senderRole: signal.senderRole,
        type: signal.type,
        payload: signal.payload,
        createdAt: signal.createdAt.toISOString(),
      })),
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("WebRTC signal polling failed:", error)
    return NextResponse.json({ error: "Signaling poll failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = signalSchema.parse(await request.json())
    const participant = await authorizedParticipant(parsed.sessionId, authSession.user.id)
    if (!participant) return NextResponse.json({ error: "Session not active or access denied" }, { status: 403 })

    const signal = {
      senderId: parsed.senderId,
      targetId: parsed.targetId,
      senderRole: participant.senderRole,
      type: parsed.type,
      payload: parsed.payload ?? null,
    }
    const pusher = getPusherServer()
    if (pusher) {
      await pusher.trigger(examChatChannel(parsed.sessionId), "webrtc-signal", signal)
      return NextResponse.json({ delivered: true, transport: "pusher" })
    }

    const cutoff = new Date(Date.now() - 10 * 60_000)
    const [, stored] = await prisma.$transaction([
      prisma.webRtcSignal.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.webRtcSignal.create({
        data: {
          sessionId: parsed.sessionId,
          senderId: signal.senderId,
          targetId: signal.targetId,
          senderRole: signal.senderRole,
          type: signal.type,
          payload: signal.payload === null ? Prisma.JsonNull : signal.payload as Prisma.InputJsonValue,
        },
      }),
    ])
    return NextResponse.json({ delivered: true, transport: "database", id: stored.id })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid signal" }, { status: 400 })
    }
    console.error("WebRTC signaling failed:", error)
    return NextResponse.json({ error: "Signaling failed" }, { status: 500 })
  }
}
