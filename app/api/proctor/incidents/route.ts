import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProctorSessionScope } from "@/lib/proctor-access"

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerSession(authOptions)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!user || !["ADMIN", "PROCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const filter = request.nextUrl.searchParams.get("filter") ?? "OPEN"
    const course = request.nextUrl.searchParams.get("course")
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "100", 10)

    if (!["ALL", "OPEN", "PENDING", "ESCALATED", "RESOLVED"].includes(filter)) {
      return NextResponse.json({ error: "Invalid incident filter" }, { status: 400 })
    }

    const reviewStatus = filter === "ALL" ? undefined
      : filter === "OPEN" ? { in: ["PENDING", "ESCALATED"] as ("PENDING" | "ESCALATED")[] }
      : filter === "RESOLVED" ? { in: ["REVIEWED", "FALSE_POSITIVE", "CONFIRMED"] as ("REVIEWED" | "FALSE_POSITIVE" | "CONFIRMED")[] }
      : filter as "PENDING" | "ESCALATED"

    const sessionScope = await getProctorSessionScope(user)
    const sessionWhere: any = { ...sessionScope }

    if (course && course !== "ALL") {
      sessionWhere.assessment = {
        course: { title: { startsWith: course, mode: "insensitive" } },
      }
    }

    const where: any = {
      session: sessionWhere,
      ...(reviewStatus ? { reviewStatus } : {}),
    }

    const [incidents, total] = await prisma.$transaction([
      prisma.proctoringEvent.findMany({
        where,
        orderBy: [{ severity: "desc" }, { createdAt: "asc" }, { id: "asc" }],
        take: Math.min(Math.max(limit, 1), 200),
        select: {
          id: true,
          sessionId: true,
          type: true,
          severity: true,
          description: true,
          createdAt: true,
          reviewStatus: true,
          reviewNotes: true,
          reviewedByName: true,
          session: {
            select: {
              user: { select: { firstName: true, lastName: true, email: true } },
              assessment: {
                select: {
                  title: true,
                  course: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      }),
      prisma.proctoringEvent.count({ where }),
    ])

    return NextResponse.json({ incidents, total }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Incident queue GET error:", error)
    return NextResponse.json({ error: "Unable to load incident queue" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getServerSession(authOptions)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!user || !["ADMIN", "PROCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const rawIds = Array.isArray(body.ids) ? body.ids : []
    const ids: string[] = rawIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    const filter = body.filter || request.nextUrl.searchParams.get("filter")

    const sessionScope = await getProctorSessionScope(user)
    const where: any = { session: sessionScope }

    if (ids.length > 0) {
      where.id = { in: ids }
    } else if (filter === "RESOLVED") {
      where.reviewStatus = { in: ["REVIEWED", "FALSE_POSITIVE", "CONFIRMED"] }
    } else if (filter === "ALL") {
      // Clear all incidents in current scope
    } else {
      return NextResponse.json({ error: "Specify incident ids or target filter" }, { status: 400 })
    }

    const deletedCount = await prisma.$transaction(async (tx) => {
      const result = await tx.proctoringEvent.deleteMany({ where })
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          actorEmail: user.email,
          action: "INCIDENT_QUEUE_CLEAR",
          category: "STAFF",
          details: `Cleared ${result.count} incident reports (${ids.length ? `${ids.length} selected items` : filter || "all"})`,
        },
      })
      return result.count
    })

    return NextResponse.json({ deleted: deletedCount })
  } catch (error) {
    console.error("Incident queue DELETE error:", error)
    return NextResponse.json({ error: "Unable to clear incident reports" }, { status: 500 })
  }
}
