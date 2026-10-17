import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AccessToken } from "livekit-server-sdk"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessExamSession } from "@/lib/proctor-access"

const schema = z.object({ sessionId: z.string().min(1).max(100) }).strict()

// Issues a short-lived LiveKit token. Learners may only publish into their own
// exam room; proctors/admins with access to the session may only subscribe.
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL
    if (!apiKey || !apiSecret || !url) {
      return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 })
    }

    const { sessionId } = schema.parse(await request.json())
    const [user, examSession] = await Promise.all([
      prisma.user.findUnique({ where: { id: authSession.user.id }, select: { id: true, role: true } }),
      prisma.examSession.findUnique({ where: { id: sessionId }, select: { userId: true, status: true } }),
    ])
    if (!user || !examSession || examSession.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Session not active or access denied" }, { status: 403 })
    }
    if (!await canAccessExamSession(user, sessionId)) {
      return NextResponse.json({ error: "Session not active or access denied" }, { status: 403 })
    }

    const isProctor = user.role === "ADMIN" || user.role === "PROCTOR"
    const room = `exam-session-${sessionId}`
    const token = new AccessToken(apiKey, apiSecret, {
      identity: `${isProctor ? "proctor" : "learner"}-${user.id}${isProctor ? `-${crypto.randomUUID().slice(0, 8)}` : ""}`,
      ttl: "2h",
    })
    token.addGrant({
      room,
      roomJoin: true,
      canPublish: !isProctor,
      canSubscribe: isProctor,
      canPublishData: false,
    })

    return NextResponse.json({ token: await token.toJwt(), url }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    console.error("LiveKit token failed:", error)
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 })
  }
}
