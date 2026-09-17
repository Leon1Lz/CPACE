import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessExamSession } from "@/lib/proctor-access"

const reviewStatuses = new Set(["PENDING", "REVIEWED", "FALSE_POSITIVE", "CONFIRMED", "ESCALATED"])

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const reviewer = await prisma.user.findUnique({ where: { id: authSession.user.id } })
    if (!reviewer || (reviewer.role !== "ADMIN" && reviewer.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const incident = await prisma.proctoringEvent.findUnique({ where: { id }, select: { sessionId: true } })
    if (!incident || !await canAccessExamSession(reviewer, incident.sessionId))
      return NextResponse.json({ error: "Incident not assigned or not found" }, { status: 403 })
    const body = await request.json()
    const reviewStatus = String(body.reviewStatus || "").toUpperCase()
    if (body.reviewNotes !== undefined && (typeof body.reviewNotes !== "string" || body.reviewNotes.length > 1000))
      return NextResponse.json({ error: "Review notes must be text no longer than 1000 characters" }, { status: 400 })
    const reviewNotes = body.reviewNotes === undefined ? undefined : body.reviewNotes.trim()
    if (!reviewStatuses.has(reviewStatus)) {
      return NextResponse.json({ error: "Invalid review status" }, { status: 400 })
    }

    const event = await prisma.$transaction(async tx => {
      const updated = await tx.proctoringEvent.update({
        where: { id },
        data: {
          reviewStatus: reviewStatus as "PENDING" | "REVIEWED" | "FALSE_POSITIVE" | "CONFIRMED" | "ESCALATED",
          reviewNotes,
          reviewedAt: reviewStatus === "PENDING" ? null : new Date(),
          reviewedById: reviewStatus === "PENDING" ? null : reviewer.id,
          reviewedByName: reviewStatus === "PENDING" ? null : `${reviewer.firstName} ${reviewer.lastName}`,
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: reviewer.id,
          actorName: `${reviewer.firstName} ${reviewer.lastName}`,
          actorEmail: reviewer.email,
          action: "PROCTORING_EVENT_REVIEW",
          category: "EXAM_SECURITY",
          details: `Event ${updated.id} marked ${reviewStatus}${reviewNotes ? `: ${reviewNotes}` : ""}`,
        },
      })
      return updated
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Proctoring event review error:", error)
    return NextResponse.json({ error: "Failed to review event" }, { status: 500 })
  }
}
