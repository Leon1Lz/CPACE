import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPusherServer } from "@/lib/pusher"

/**
 * POST /api/pusher/auth
 *
 * Pusher calls this endpoint when a client tries to subscribe to a
 * private channel (e.g. "private-exam-session-{sessionId}").
 * We verify the user is either the examinee OR a proctor/admin.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.formData()
    const socketId = body.get("socket_id") as string
    const channelName = body.get("channel_name") as string

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 })
    }

    // Look up the user
    const userRecord = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    })
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let hasAccess = false

    if (channelName === "private-proctor-notifications") {
      hasAccess = userRecord.role === "PROCTOR" || userRecord.role === "ADMIN"
    } else {
      // Extract sessionId from channel name: "private-exam-session-{sessionId}"
      const match = channelName.match(/^private-exam-session-(.+)$/)
      if (!match) {
        return NextResponse.json({ error: "Invalid channel" }, { status: 403 })
      }

      const examSessionId = match[1]

      // Check the exam session exists
      const examSession = await prisma.examSession.findUnique({
        where: { id: examSessionId },
        select: { userId: true },
      })
      if (!examSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      // Verify access: must be the examinee or a proctor/admin
      hasAccess =
        examSession.userId === userRecord.id ||
        userRecord.role === "PROCTOR" ||
        userRecord.role === "ADMIN"
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Authenticate the Pusher channel subscription
    const pusher = getPusherServer()
    if (!pusher) {
      return NextResponse.json({ error: "Pusher not configured" }, { status: 503 })
    }
    const authResponse = pusher.authorizeChannel(socketId, channelName)

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Pusher auth error:", error)
    return NextResponse.json({ error: "Auth failed" }, { status: 500 })
  }
}
