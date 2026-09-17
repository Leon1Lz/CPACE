import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseProctoringReason } from "@/lib/proctoring-events"
import { isSafeImageDataUrl } from "@/lib/authorization"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { notifySessionProctors, publishProctorSessionEvent } from "@/lib/proctor-access"
import { assessmentScheduleError } from "@/lib/assessment-schedule"
import { lockAssessment, AssessmentIntegrityError } from "@/lib/assessment-integrity"
import { examDeadline } from "@/lib/assessment-timing"
import { z } from "zod"

const violationSchema = z.object({
  sessionId: z.string().min(1).max(100),
  flagged: z.literal(true),
  flagReason: z.string().trim().min(1).max(1000).optional(),
}).strict()

// POST — called when a learner clicks "Start Exam"
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id: assessmentId } = await params

    let identityPhoto: string | undefined
    let idPhoto: string | undefined
    let proctoringConsent = false
    try {
      const body = await request.json()
      identityPhoto = body.identityPhoto
      idPhoto = body.idPhoto
      proctoringConsent = body.proctoringConsent === true
    } catch {
      // Body is empty or not JSON
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { type: true, attempts: true, requireProctoringConsent: true, isPublished: true, courseId: true, startsAt: true, endsAt: true },
    })
    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    if (!assessment.isPublished) return NextResponse.json({ error: "Assessment is not available" }, { status: 403 })
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: assessment.courseId } },
      select: { status: true },
    })
    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json({ error: "An active or completed course enrollment is required" }, { status: 403 })
    }
    const blocker = await getLearningPathBlocker(user.id, { courseId: assessment.courseId, assessmentId })
    if (blocker) return NextResponse.json(blocker, { status: 403 })
    if (assessment.type === "FINAL_EXAM" && (!identityPhoto || !idPhoto)) {
      return NextResponse.json({ error: "Identity and ID verification are required" }, { status: 400 })
    }
    if (assessment.type === "FINAL_EXAM" && (!isSafeImageDataUrl(identityPhoto) || !isSafeImageDataUrl(idPhoto))) {
      return NextResponse.json({ error: "Identity images must be valid JPEG or PNG files no larger than 2 MB" }, { status: 400 })
    }
    if (assessment.type === "FINAL_EXAM" && assessment.requireProctoringConsent && !proctoringConsent) {
      return NextResponse.json({ error: "Proctoring consent is required" }, { status: 400 })
    }

    // Grab IP + User-Agent from headers
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"
    const userAgent = request.headers.get("user-agent") ?? undefined

    const { examSession, resumed } = await prisma.$transaction(async tx => {
      await lockAssessment(tx, assessmentId)
      // Refresh settings after the lock; staff edits cannot race the new attempt.
      const settings = await tx.assessment.findUniqueOrThrow({ where: { id: assessmentId } })
      if (!settings.isPublished) throw new AssessmentIntegrityError("Assessment is not available", 403)
      if (settings.type === "FINAL_EXAM" && (!isSafeImageDataUrl(identityPhoto) || !isSafeImageDataUrl(idPhoto) || (settings.requireProctoringConsent && !proctoringConsent)))
        throw new AssessmentIntegrityError("Identity, ID verification, and required consent must be completed", 403)
      // Serializable isolation prevents concurrent starts from silently making two attempts.
      const existing = await tx.examSession.findFirst({
        where: { userId: user.id, assessmentId, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" },
      })
      if (existing) {
        if (!settings.bankLockedAt) await tx.assessment.update({ where: { id: assessmentId }, data: { bankLockedAt: existing.startedAt } })
        if (settings.type === "FINAL_EXAM" && (!existing.identityVerifiedAt || (proctoringConsent && !existing.consentAt))) {
          await tx.examSession.update({ where: { id: existing.id }, data: {
            ...(!existing.identityVerifiedAt ? { identityVerifiedAt: new Date() } : {}),
            ...(proctoringConsent && !existing.consentAt ? { consentAt: new Date(), consentVersion: "CPACE-PROCTORING-v1" } : {}),
          } })
        }
        return { examSession: existing, resumed: true }
      }
      const scheduleError = assessmentScheduleError(settings)
      if (scheduleError) throw new Error(scheduleError)
      if (settings.type === "FINAL_EXAM" && settings.attempts !== null) {
        const attempts = await tx.assessmentResult.count({ where: { userId: user.id, assessmentId } })
        if (attempts >= settings.attempts) throw new Error("Maximum attempts reached")
      }
      const startedAt = new Date()
      if (!settings.bankLockedAt) await tx.assessment.update({ where: { id: assessmentId }, data: { bankLockedAt: startedAt } })
      const created = await tx.examSession.create({
      data: {
        startedAt,
        deadlineAt: examDeadline(startedAt, settings.timeLimit),
        identityVerifiedAt: settings.type === "FINAL_EXAM" ? startedAt : null,
        userId: user.id,
        assessmentId,
        ipAddress,
        userAgent,
        identityPhoto,
        idPhoto,
        consentAt: proctoringConsent ? new Date() : undefined,
        consentVersion: proctoringConsent ? "CPACE-PROCTORING-v1" : undefined,
        cameraStatus: "CONNECTED",
        detectorStatus: "STARTING",
        status: "IN_PROGRESS",
      },
      })
      return { examSession: created, resumed: false }
    }, { isolationLevel: "Serializable" })
    return NextResponse.json({ sessionId: examSession.id, startedAt: examSession.startedAt,
      deadlineAt: examSession.deadlineAt,
      answers: examSession.draftAnswers, version: examSession.draftVersion, resumed }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof Error && ["This assessment has not opened yet.", "This assessment is closed for new attempts."].includes(error.message))
      return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof Error && error.message === "Maximum attempts reached")
      return NextResponse.json({ error: error.message }, { status: 409 })
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034")
      return NextResponse.json({ error: "Another tab is starting this attempt. Please retry to resume it." }, { status: 409 })
    console.error("Session start error:", error)
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
  }
}

// PATCH — update active session status or flag it (e.g. for browser lock violations)
export async function PATCH(request: NextRequest, _context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id: assessmentId } = await _context.params
    const { sessionId, flagged, flagReason } = violationSchema.parse(await request.json())

    const examSession = await prisma.examSession.findFirst({
      where: { id: sessionId, userId: user.id, assessmentId },
      include: { assessment: { select: { title: true, evidenceCaptureEnabled: true } } }
    })

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found or forbidden" }, { status: 404 })
    }
    if (examSession.status !== "IN_PROGRESS") return NextResponse.json({ error: "This exam session is no longer active" }, { status: 409 })

    // Learners may report new violations, never clear or replace staff review
    // reasons. Lifecycle and ownership are rechecked atomically at the write.
    const flagUpdate = await prisma.examSession.updateMany({
      where: { id: sessionId, userId: user.id, assessmentId, status: "IN_PROGRESS" },
      data: { flagged: true },
    })
    if (!flagUpdate.count) return NextResponse.json({ error: "This exam session is no longer active" }, { status: 409 })
    // Keep the gallery's initial reason useful, but never overwrite a reason
    // added by staff (including one written after our ownership lookup).
    if (examSession.flagReason === null && flagReason) {
      await prisma.examSession.updateMany({
        where: { id: sessionId, userId: user.id, assessmentId, status: "IN_PROGRESS", flagReason: null },
        data: { flagReason },
      })
    }

    // If flagged, notify the proctors via Pusher in real-time!
    if (flagged) {
      const { triggerEvent } = await import("@/lib/pusher")
      const { addLiveMotionEvent, getLiveExamState } = await import("@/lib/exam-live-store")
      const violationReason = flagReason || "Security violation"
      const parsedEvent = parseProctoringReason(violationReason)
      await prisma.proctoringEvent.create({
        data: {
          sessionId,
          type: parsedEvent.type,
          severity: parsedEvent.severity,
          description: parsedEvent.description,
          duration: parsedEvent.duration,
          evidenceSnapshot: examSession.assessment.evidenceCaptureEnabled ? getLiveExamState(sessionId).snapshot : null,
        },
      })
      addLiveMotionEvent(sessionId, violationReason)
      try {
        await Promise.all([
          publishProctorSessionEvent(sessionId, "session-flagged", {
            sessionId,
            learnerName: `${user.firstName} ${user.lastName}`,
            assessmentTitle: examSession.assessment.title,
            flagReason: violationReason,
          }),
          triggerEvent(`private-exam-session-${sessionId}`, "motion-violation", {
            reason: violationReason,
            occurredAt: new Date().toISOString(),
          }),
        ])
      } catch (pusherError) {
        console.error("Failed to send real-time flag notification:", pusherError)
      }

      // Create persistent DB notifications for proctors and admins
      await notifySessionProctors(sessionId, "Exam Session Flagged", `${user.firstName} ${user.lastName} was flagged during "${examSession.assessment.title}". Reason: ${flagReason || "Unknown"}`)

      // Record in AuditLog table
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          actorEmail: user.email,
          action: "EXAM_VIOLATION",
          category: "EXAM_SECURITY",
          details: `Flagged in "${examSession.assessment.title}": ${flagReason || "Security violation"}`,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ id: sessionId, flagged: true })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid violation report" }, { status: 400 })
    console.error("Session PATCH error:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
