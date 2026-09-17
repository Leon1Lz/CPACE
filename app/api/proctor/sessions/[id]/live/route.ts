import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessExamSession } from "@/lib/proctor-access"
import { clearLiveExamState, getLiveExamState } from "@/lib/exam-live-store"
import { buildSimulatedMonitor } from "@/lib/proctor-simulation"
import { pruneExpiredProctoringSession } from "@/lib/proctoring-retention"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const viewer = await prisma.user.findUnique({ where: { id: authSession.user.id } })
    if (!viewer || (viewer.role !== "ADMIN" && viewer.role !== "PROCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    if (id.startsWith("simulation-")) {
      const simulated = buildSimulatedMonitor(id)
      return simulated
        ? NextResponse.json(simulated)
        : NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }

    if (!await canAccessExamSession(viewer, id)) return NextResponse.json({ error: "Session not assigned or not found" }, { status: 403 })
    await pruneExpiredProctoringSession(id)

    const examSession = await prisma.examSession.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assessment: {
          select: { id: true, title: true, type: true, motionDetectionEnabled: true, course: { select: { title: true } } },
        },
      },
    })
    if (!examSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    if (examSession.status !== "IN_PROGRESS") clearLiveExamState(id)

    const proctoringEvents = await prisma.proctoringEvent.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    const live = getLiveExamState(id)
    const { draftAnswers: _draftAnswers, draftVersion: _draftVersion, ...safeSession } = examSession

    return NextResponse.json({
      session: safeSession,
      liveSnapshot: examSession.status === "IN_PROGRESS" ? live.snapshot : null,
      snapshotAt: examSession.status === "IN_PROGRESS" ? live.snapshotAt : null,
      events: proctoringEvents.map((event) => ({
        id: event.id,
        reason: `[${event.severity}] ${event.type}: ${event.description}${event.duration === null ? "" : ` (${event.duration}s)`}`,
        occurredAt: event.createdAt.toISOString(),
        reviewStatus: event.reviewStatus,
        reviewNotes: event.reviewNotes,
        reviewedByName: event.reviewedByName,
        evidenceSnapshot: event.evidenceSnapshot,
      })),
    })
  } catch (error) {
    console.error("Live proctor monitor GET error:", error)
    return NextResponse.json({ error: "Failed to load live monitor" }, { status: 500 })
  }
}
