import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { triggerEvent, examChatChannel } from "@/lib/pusher"

// GET /api/chat?sessionId=xxx — fetch messages for a session
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sessionId = req.nextUrl.searchParams.get("sessionId")
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })

    const userRecord = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Verify the user has access to this session (is the examinee OR is a proctor/admin)
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    })
    if (!examSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const hasAccess =
      examSession.userId === userRecord.id ||
      userRecord.role === "PROCTOR" ||
      userRecord.role === "ADMIN"

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const messages = await prisma.examChat.findMany({
      where: { sessionId },
      orderBy: { sentAt: "asc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    })

    // Mark messages from others as read
    await prisma.examChat.updateMany({
      where: { sessionId, senderId: { not: userRecord.id }, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Chat GET error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/chat — send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { sessionId, message } = await req.json()
    if (!sessionId || !message?.trim()) {
      return NextResponse.json({ error: "sessionId and message required" }, { status: 400 })
    }

    const userRecord = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Verify access
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: { 
        userId: true, 
        status: true,
        user: { select: { firstName: true, lastName: true } },
        assessment: { select: { title: true } }
      },
    })
    if (!examSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const hasAccess =
      examSession.userId === userRecord.id ||
      userRecord.role === "PROCTOR" ||
      userRecord.role === "ADMIN"

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const chat = await prisma.examChat.create({
      data: {
        message: message.trim(),
        senderId: userRecord.id,
        sessionId,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    })

    // Trigger Pusher event in background
    try {
      await triggerEvent(examChatChannel(sessionId), "new-message", chat as any)

      // Notify proctors if message is from examinee (LEARNER)
      if (userRecord.role === "LEARNER") {
        await triggerEvent("private-proctor-notifications", "new-chat-message", {
          sessionId,
          message: chat.message,
          learnerName: `${userRecord.firstName} ${userRecord.lastName}`,
          assessmentTitle: examSession.assessment.title,
          chat
        })
      }
    } catch (pusherError) {
      console.error("Failed to trigger Pusher event:", pusherError)
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Chat POST error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
