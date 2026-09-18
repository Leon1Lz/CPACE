import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { assessmentScheduleError } from "@/lib/assessment-schedule"
import { examExpired, submissionAnswers } from "@/lib/assessment-timing"
import { lockAssessment, AssessmentIntegrityError } from "@/lib/assessment-integrity"

const submissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().min(1).max(100),
    selectedOptionId: z.string().min(1).max(100).optional(),
    content: z.string().max(10000).optional(),
  })).max(500),
  startedAt: z.string().datetime().optional(),
  sessionId: z.string().min(1).max(100).optional(),
}).strict()

class SubmissionConflictError extends Error {}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id: assessmentId } = await params
    const { answers, sessionId } = submissionSchema.parse(await request.json())
    // answers: { questionId: string, selectedOptionId?: string, content?: string }[]

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: { include: { options: true } },
        course: { select: { id: true, title: true } },
      },
    })
    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    if (!assessment.isPublished) return NextResponse.json({ error: "Assessment is not available" }, { status: 403 })
    if (!sessionId) {
      const scheduleError = assessmentScheduleError(assessment)
      if (scheduleError) return NextResponse.json({ error: scheduleError }, { status: 403 })
      if (assessment.startsAt || assessment.endsAt)
        return NextResponse.json({ error: "Start an exam session before submitting this scheduled assessment." }, { status: 403 })
    }

    // Confirmation is idempotent for this learner's submitted session, never a new attempt.
    if (sessionId) {
      const submitted = await prisma.examSession.findFirst({
        where: { id: sessionId, userId: user.id, assessmentId, status: "SUBMITTED" },
        include: { result: { include: { answers: true } } },
      })
      if (submitted?.result) {
        const gradingPending = assessment.questions.some(q => q.type === "SHORT_ANSWER" || q.type === "ESSAY") && !submitted.result.gradedAt
        const released = !gradingPending && (assessment.releaseScores !== false || Boolean(assessment.scoresReleasedAt && new Date() >= assessment.scoresReleasedAt))
        const certificate = released ? await prisma.certificate.findFirst({ where: { userId: user.id, courseId: assessment.courseId } }) : null
        return NextResponse.json({ resultId: submitted.result.id,
          score: released ? submitted.result.score : null, passed: released ? submitted.result.passed : null,
          totalPoints: assessment.questions.reduce((sum, question) => sum + question.points, 0),
          earnedPoints: released ? submitted.result.answers.reduce((sum, answer) => sum + answer.points, 0) : null,
          attempt: submitted.result.attempt, certificate,
          hasOpenEnded: assessment.questions.some(q => q.type === "SHORT_ANSWER" || q.type === "ESSAY"),
          scoresReleased: released, gradingPending, recovered: true })
      }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: assessment.courseId } },
      select: { status: true },
    })
    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json({ error: "An active or completed course enrollment is required" }, { status: 403 })
    }
    const blocker = await getLearningPathBlocker(user.id, { courseId: assessment.courseId, assessmentId })
    if (blocker) return NextResponse.json(blocker, { status: 403 })
    if (!sessionId && assessment.timeLimit)
      return NextResponse.json({ error: "Start a server-timed exam session before submitting." }, { status: 403 })

    let examSession = null
    let timedOut = false
    if (sessionId) {
      examSession = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "exam_sessions" WHERE "id" = ${sessionId} AND "userId" = ${user.id} AND "assessmentId" = ${assessmentId} FOR UPDATE`
      const active = await tx.examSession.findFirst({
        where: { id: sessionId, userId: user.id, assessmentId, status: "IN_PROGRESS" },
        select: {
          id: true,
          startedAt: true,
          deadlineAt: true,
          draftAnswers: true,
          identityVerifiedAt: true,
          identityPhoto: true,
          idPhoto: true,
          consentAt: true,
          lastHeartbeatAt: true,
          cameraStatus: true,
          detectorStatus: true,
        },
      })
      timedOut = examExpired(active?.deadlineAt)
      return active
      })
      if (!examSession) return NextResponse.json({ error: "Invalid active exam session" }, { status: 403 })
    }
    if (assessment.type === "FINAL_EXAM") {
      const heartbeatIsFresh = examSession?.lastHeartbeatAt
        && Date.now() - examSession.lastHeartbeatAt.getTime() <= 30_000
      const detectorIsReady = assessment.motionDetectionEnabled === false
        ? examSession?.detectorStatus === "DISABLED" || examSession?.detectorStatus === "ACTIVE"
        : examSession?.detectorStatus === "ACTIVE"
      if (
        !examSession
        || !(examSession.identityVerifiedAt || (examSession.identityPhoto && examSession.idPhoto))
        || (assessment.requireProctoringConsent && !examSession.consentAt)
      ) {
        return NextResponse.json({ error: "A verified proctored session is required" }, { status: 403 })
      }
      if (!timedOut && examSession.cameraStatus !== "CONNECTED") {
        return NextResponse.json({ error: "Your webcam is not connected. Reconnect it and retry Submit. Your answers remain on this page.", code: "CAMERA_NOT_READY" }, { status: 403 })
      }
      if (!timedOut && !heartbeatIsFresh) {
        return NextResponse.json({ error: "The live proctoring feed has not connected or is stale. Retry the live feed, then submit again. Your answers remain on this page.", code: "LIVE_FEED_NOT_READY" }, { status: 403 })
      }
      if (!timedOut && !detectorIsReady) {
        return NextResponse.json({ error: "The motion detector is not ready. Wait for it to start or contact your proctor, then retry Submit. Your answers remain on this page.", code: "DETECTOR_NOT_READY" }, { status: 403 })
      }
    }

    // Score the answers
    const acceptedAnswers = submissionAnswers(answers, examSession?.draftAnswers, timedOut)
    let totalPoints = 0
    let earnedPoints = 0
    const scoredAnswers: { questionId: string; content: string; isCorrect: boolean; points: number }[] = []

    for (const question of assessment.questions) {
      totalPoints += question.points
      const userAnswer = acceptedAnswers.find(a => a.questionId === question.id)
      if (!userAnswer) {
        scoredAnswers.push({ questionId: question.id, content: "", isCorrect: false, points: 0 })
        continue
      }

      let isCorrect = false
      let pointsEarned = 0
      let answerContent = userAnswer.content ?? ""

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        const selectedOption = question.options.find(o => o.id === userAnswer.selectedOptionId)
        isCorrect = selectedOption?.isCorrect ?? false
        answerContent = selectedOption?.text ?? ""
        pointsEarned = isCorrect ? question.points : 0
      } else if (question.type === "SHORT_ANSWER" || question.type === "ESSAY") {
        // Open-ended: store the content, mark for manual review (isCorrect = false until reviewed)
        answerContent = userAnswer.content ?? ""
        isCorrect = false
        pointsEarned = 0
      }

      earnedPoints += pointsEarned
      scoredAnswers.push({ questionId: question.id, content: answerContent, isCorrect, points: pointsEarned })
    }

    // Check if any open-ended questions exist (they are manually reviewed)
    const hasOpenEnded = assessment.questions.some(
      q => q.type === "SHORT_ANSWER" || q.type === "ESSAY"
    )
    // For scoring purposes, only auto-scored questions count toward total when open-ended exist
    const autoScoredTotal = assessment.questions
      .filter(q => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE")
      .reduce((sum, q) => sum + q.points, 0)
    const scoreBase = hasOpenEnded ? (autoScoredTotal > 0 ? autoScoredTotal : totalPoints) : totalPoints
    const score = scoreBase > 0 ? (earnedPoints / scoreBase) * 100 : 0
    const passed = !hasOpenEnded && score >= assessment.passingScore

    const { result, attemptNumber } = await prisma.$transaction(async (tx) => {
      await lockAssessment(tx, assessmentId)
      const current = await tx.assessment.findUniqueOrThrow({ where: { id: assessmentId } })
      if (!current.isPublished) throw new AssessmentIntegrityError("Assessment is not available", 403)
      if (!examSession) {
        if (current.type === "FINAL_EXAM") throw new AssessmentIntegrityError("A verified proctored session is required", 403)
        if (current.timeLimit) throw new AssessmentIntegrityError("Start a server-timed exam session before submitting.", 403)
        const scheduleError = assessmentScheduleError(current)
        if (scheduleError || current.startsAt || current.endsAt)
          throw new AssessmentIntegrityError(scheduleError ?? "Start an exam session before submitting this scheduled assessment.", 403)
      }
      if (current.questionVersion !== assessment.questionVersion)
        throw new SubmissionConflictError("Questions changed before your attempt was recorded. Please reload and retry.")
      if (!current.bankLockedAt) await tx.assessment.update({ where: { id: assessmentId }, data: { bankLockedAt: new Date() } })
      const previousAttempts = await tx.assessmentResult.count({
        where: { assessmentId, userId: user.id },
      })
      if (
        assessment.type === "FINAL_EXAM"
        && assessment.attempts !== null
        && previousAttempts >= assessment.attempts
      ) {
        throw new SubmissionConflictError("Maximum attempts reached")
      }

      if (examSession) {
        const claimed = await tx.examSession.updateMany({
          where: { id: examSession.id, userId: user.id, assessmentId, status: "IN_PROGRESS" },
          data: { status: "SUBMITTED", submittedAt: new Date() },
        })
        if (claimed.count !== 1) throw new SubmissionConflictError("Exam session was already submitted")
      }

      const createdResult = await tx.assessmentResult.create({
        data: {
          userId: user.id,
          assessmentId,
          score,
          passed,
          attempt: previousAttempts + 1,
          startedAt: examSession?.startedAt ?? new Date(),
          completedAt: new Date(),
          gradedAt: hasOpenEnded ? null : new Date(),
          answers: { create: scoredAnswers },
        },
      })

      if (examSession) {
        await tx.examSession.update({
          where: { id: examSession.id },
          data: { resultId: createdResult.id, draftAnswers: {} },
        })
      }
      return { result: createdResult, attemptNumber: previousAttempts + 1 }
    }, { isolationLevel: "Serializable" })

    const released = !hasOpenEnded && (assessment.releaseScores !== false || (assessment.scoresReleasedAt && new Date() >= new Date(assessment.scoresReleasedAt)))
    const { createNotification } = await import("@/lib/notifications")
    
    // Create DB notification for assessment completion
    if (released) {
      await createNotification({
        userId: user.id,
        title: passed ? "Assessment Passed ✅" : "Assessment Completed",
        message: `You completed "${assessment.title}" with a score of ${score.toFixed(0)}%.`,
        type: passed ? "SUCCESS" : "INFO",
        link: "/dashboard/assessments",
      })
    } else {
      await createNotification({
        userId: user.id,
        title: "Assessment Submitted 📝",
        message: `You successfully submitted your answers for "${assessment.title}". Results will be released once they are processed.`,
        type: "INFO",
        link: "/dashboard/assessments",
      })
    }

    // Auto-issue certificate if FINAL_EXAM and passed (only when released!)
    let certificate = null
    if (released && assessment.type === "FINAL_EXAM" && passed) {
      const existing = await prisma.certificate.findFirst({
        where: { userId: user.id, courseId: assessment.courseId },
      })
      if (!existing) {
        const certNumber = `CPACE-${Date.now()}-${user.id.slice(-4).toUpperCase()}`
        certificate = await prisma.certificate.create({
          data: {
            title: `Certificate of Completion — ${assessment.course.title}`,
            description: `Successfully completed the final examination for ${assessment.course.title}`,
            certificateNumber: certNumber,
            userId: user.id,
            courseId: assessment.courseId,
          },
        })

        // Create DB notification for certificate
        await createNotification({
          userId: user.id,
          title: "Certificate Issued 🎓",
          message: `Congratulations! You earned a certificate for "${assessment.course.title}".`,
          type: "SUCCESS",
          link: "/dashboard/certificates",
        })

        // Update enrollment to COMPLETED
        await prisma.enrollment.updateMany({
          where: { userId: user.id, courseId: assessment.courseId },
          data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
        })
      }
    }

    return NextResponse.json({
      resultId: result.id,
      score: released ? score : null,
      passed: released ? passed : null,
      totalPoints,
      earnedPoints: released ? earnedPoints : null,
      attempt: attemptNumber,
      certificate: released ? certificate : null,
      hasOpenEnded,
      gradingPending: hasOpenEnded,
      scoresReleased: released,
      timedOut,
      answerSource: timedOut ? "SERVER_SAVED_DRAFT" : "SUBMISSION",
    })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
    }
    if (error instanceof SubmissionConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "A concurrent submission was detected. Please retry." }, { status: 409 })
    }
    console.error("Submit error:", error)
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 })
  }
}
