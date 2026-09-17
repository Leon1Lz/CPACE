import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notifications — Retrieve user's database notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const dbNotifs = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const typeMapping: Record<string, string> = {
      CERTIFICATE: "certificate",
      SUCCESS: "pass",
      WARNING: "fail",
      COURSE: "enrollment",
      ENROLLMENT: "enrollment",
      EXAM: "flag",
      ALERT: "flag",
      INFO: "enrollment",
    }

    const notifications = dbNotifs.map((n: any) => ({
      id: n.id,
      type: typeMapping[n.type] || "enrollment",
      title: n.title,
      message: n.message,
      href: n.link || "/dashboard",
      at: n.createdAt.toISOString(),
      isRead: n.isRead,
    }))

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Notifications GET error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// PATCH /api/notifications — Mark single or all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const { id, all } = body

    if (all) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: "Missing notification id" }, { status: 400 })
    }

    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH error:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
