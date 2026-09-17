import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessExamSession, getProctorSessionScope, notifySessionProctors } from "@/lib/proctor-access"
import { z } from "zod"

const patchSchema = z.object({ id: z.string().min(1).max(100), flagged: z.boolean().optional(), flagReason: z.string().max(1000).nullable().optional() }).strict()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? undefined
    const parsedStatus = status ? z.enum(["IN_PROGRESS", "SUBMITTED", "ABANDONED", "FLAGGED"]).safeParse(status) : null
    if (parsedStatus && !parsedStatus.success) return NextResponse.json({ error: "Invalid session status" }, { status: 400 })
    const flagged = searchParams.get("flagged") === "true" ? true : undefined
    const paginated = searchParams.get("pagination") === "true"
    const cursor = paginated ? searchParams.get("cursor") : null

    const sessions = await prisma.examSession.findMany({
      where: {
        AND: [await getProctorSessionScope(user)],
        ...(parsedStatus?.success && { status: parsedStatus.data }),
        ...(flagged !== undefined && { flagged }),
      },
      select: {
        id: true, status: true, startedAt: true, submittedAt: true, flagged: true, flagReason: true,
        lastHeartbeatAt: true, cameraStatus: true, detectorStatus: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assessment: { select: { id: true, title: true, type: true, motionDetectionEnabled: true, course: { select: { title: true } } } },
      },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      take: paginated ? 101 : 100,
    })

    // Identity documents, IP addresses, and user agents are available only on
    // the explicit audited detail view, never in bulk list responses.
    const page = sessions.slice(0, 100)
    const safeSessions = page
    return NextResponse.json(paginated
      ? { data: safeSessions, nextCursor: sessions.length > 100 ? page[page.length - 1].id : null }
      : safeSessions)
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, flagged, flagReason } = patchSchema.parse(await req.json())
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    if (!await canAccessExamSession(user, id)) return NextResponse.json({ error: "Session not assigned" }, { status: 403 })

    const updated = await prisma.examSession.update({
      where: { id },
      data: {
        ...(flagged !== undefined && { flagged }),
        ...(flagReason !== undefined && { flagReason }),
      },
    })

    // If flagged, notify other proctors via DB notifications
    if (flagged === true) {
      const examSession = await prisma.examSession.findUnique({
        where: { id },
        include: { user: true, assessment: true }
      })
      if (examSession) {
        await notifySessionProctors(id, "Exam Session Flagged", `${examSession.user.firstName} ${examSession.user.lastName} was manually flagged during "${examSession.assessment.title}". Reason: ${flagReason || "Unknown"}`)
      }
    }

    return NextResponse.json({ id: updated.id, flagged: updated.flagged, flagReason: updated.flagReason, status: updated.status })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid session update" }, { status: 400 })
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}

// DELETE — permanently remove completed/abandoned monitoring history.
// Assessment results and certificates are preserved because they are separate records.
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can delete exam history" }, { status: 403 })
    }

    const body = await req.json()
    const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : []
    const ids: string[] = Array.from(new Set(rawIds.filter((id): id is string => typeof id === "string" && id.length > 0)))
    if (!ids.length || ids.length > 100) {
      return NextResponse.json({ error: "Select between 1 and 100 history records" }, { status: 400 })
    }

    const records = await prisma.examSession.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        status: true,
        user: { select: { firstName: true, lastName: true } },
        assessment: { select: { title: true } },
      },
    })
    if (records.length !== ids.length) {
      return NextResponse.json({ error: "One or more history records no longer exist" }, { status: 404 })
    }
    if (records.some((record) => record.status === "IN_PROGRESS")) {
      return NextResponse.json({ error: "Active exam sessions cannot be deleted" }, { status: 409 })
    }

    const deleted = await prisma.$transaction(async (transaction) => {
      const result = await transaction.examSession.deleteMany({ where: { id: { in: ids } } })
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          actorEmail: user.email,
          action: "EXAM_HISTORY_DELETE",
          category: "STAFF",
          details: JSON.stringify({
            deletedCount: result.count,
            sessions: records.map((record) => ({
              id: record.id,
              learner: `${record.user.firstName} ${record.user.lastName}`,
              assessment: record.assessment.title,
              status: record.status,
            })),
          }),
        },
      })
      return result.count
    })

    return NextResponse.json({ deleted })
  } catch (error) {
    console.error("Exam history DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete exam history" }, { status: 500 })
  }
}
