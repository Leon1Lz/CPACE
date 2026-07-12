import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? undefined
    const flagged = searchParams.get("flagged") === "true" ? true : undefined

    const sessions = await prisma.examSession.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(flagged !== undefined && { flagged }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assessment: { select: { id: true, title: true, type: true, course: { select: { title: true } } } },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    })

    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, flagged, flagReason, status } = await req.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const updated = await prisma.examSession.update({
      where: { id },
      data: {
        ...(flagged !== undefined && { flagged }),
        ...(flagReason !== undefined && { flagReason }),
        ...(status && { status }),
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
