import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageOwnedResource } from "@/lib/authorization"
import { z } from "zod"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { lockAssessment, assertNoAssessmentAttempts, AssessmentIntegrityError } from "@/lib/assessment-integrity"

const assessmentUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  type: z.enum(["REVIEWER", "PRACTICE_EXAM", "RULES_GUIDELINES", "FINAL_EXAM", "QUIZ", "ASSIGNMENT"]).optional(),
  timeLimit: z.number().int().min(1).max(1440).nullable().optional(),
  attempts: z.number().int().min(1).max(100).nullable().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
  releaseScores: z.boolean().optional(),
  scoresReleasedAt: z.coerce.date().nullable().optional(),
  startsAt: z.string().datetime({ offset: true }).transform(value => new Date(value)).nullable().optional(),
  endsAt: z.string().datetime({ offset: true }).transform(value => new Date(value)).nullable().optional(),
  materialUrl: z.null().optional(),
  materialName: z.null().optional(),
  motionDetectionEnabled: z.boolean().optional(),
  detectFaceAbsence: z.boolean().optional(),
  detectMultipleFaces: z.boolean().optional(),
  detectGaze: z.boolean().optional(),
  detectPosture: z.boolean().optional(),
  detectionHoldMs: z.number().int().min(250).max(60000).optional(),
  detectionCooldownMs: z.number().int().min(500).max(300000).optional(),
  evidenceCaptureEnabled: z.boolean().optional(),
  evidenceRetentionDays: z.number().int().min(0).max(365).optional(),
  requireProctoringConsent: z.boolean().optional(),
}).strict()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            enrollments: { where: { userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { id: true } },
          },
        },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: { orderBy: { order: "asc" } },
          },
        },
        _count: { select: { results: user.role === "LEARNER" ? { where: { userId: user.id } } : true, questions: true } },
      },
    })

    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const learnerAccess = user.role === "LEARNER" && assessment.isPublished && assessment.course.enrollments.length > 0
    const staffAccess = canManageOwnedResource(user, assessment.course.instructorId)
    if (!learnerAccess && !staffAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (user.role === "LEARNER") {
      const blocker = await getLearningPathBlocker(user.id, { courseId: assessment.course.id, assessmentId: id })
      if (blocker) return NextResponse.json(blocker, { status: 403 })
    }

    const { enrollments: _enrollments, instructorId: _instructorId, ...safeCourse } = assessment.course
    if (user.role === "LEARNER") {
      return NextResponse.json({
        ...assessment,
        course: safeCourse,
        questions: assessment.questions.map((question) => ({
          ...question,
          options: question.options.map(({ isCorrect: _isCorrect, ...option }) => option),
        })),
      })
    }
    return NextResponse.json({ ...assessment, course: safeCourse })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const rawData = assessmentUpdateSchema.parse(await request.json())

    // Fetch existing state
    const existing = await prisma.assessment.findUnique({
      where: { id },
      include: { course: true }
    })
    if (!existing) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    if (!canManageOwnedResource(user, existing.course.instructorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const wasReleased = existing.releaseScores !== false || (existing.scoresReleasedAt && new Date() >= new Date(existing.scoresReleasedAt))
    const startsAt = rawData.startsAt === undefined ? existing.startsAt : rawData.startsAt
    const endsAt = rawData.endsAt === undefined ? existing.endsAt : rawData.endsAt
    if (startsAt && endsAt && endsAt <= startsAt) {
      return NextResponse.json({ error: "End date and time must be after the start." }, { status: 400 })
    }

    // Perform database update
    const updated = await prisma.$transaction(async tx => {
      await lockAssessment(tx, id)
      const current = await tx.assessment.findUniqueOrThrow({ where: { id } })
      if (current.bankLockedAt && ((rawData.type !== undefined && rawData.type !== current.type)
        || (rawData.timeLimit !== undefined && rawData.timeLimit !== current.timeLimit)
        || (rawData.passingScore !== undefined && rawData.passingScore !== current.passingScore)))
        throw new AssessmentIntegrityError("Type, time limit, and passing score are locked after attempts begin. Create a new assessment for these changes.")
      const start = rawData.startsAt === undefined ? current.startsAt : rawData.startsAt
      const end = rawData.endsAt === undefined ? current.endsAt : rawData.endsAt
      if (start && end && end <= start) throw new AssessmentIntegrityError("End date and time must be after the start.", 400)
      return tx.assessment.update({ where: { id }, data: rawData })
    })

    const isReleasedNow = updated.releaseScores !== false || (updated.scoresReleasedAt && new Date() >= new Date(updated.scoresReleasedAt))

    // Transition triggered: Release scores and generate certificates/notifications
    if (isReleasedNow && (!wasReleased || rawData.releaseScores === true)) {
      const passedResults = await prisma.assessmentResult.findMany({
        where: { assessmentId: id, passed: true, gradedAt: { not: null } },
        include: { user: true },
      })

      const { createNotification } = await import("@/lib/notifications")

      for (const res of passedResults) {
        // Send exam result notification
        await createNotification({
          userId: res.userId,
          title: "Exam Results Released 📢",
          message: `Your score of ${res.score.toFixed(0)}% for "${updated.title}" is now available.`,
          type: "SUCCESS",
          link: "/dashboard/assessments",
        })

        // Auto-issue certificate if final exam
        if (updated.type === "FINAL_EXAM") {
          const certExists = await prisma.certificate.findFirst({
            where: { userId: res.userId, courseId: updated.courseId },
          })
          if (!certExists) {
            const certNumber = `CPACE-${Date.now()}-${res.userId.slice(-4).toUpperCase()}`
            await prisma.certificate.create({
              data: {
                title: `Certificate of Completion — ${existing.course.title}`,
                description: `Successfully completed the final examination for ${existing.course.title}`,
                certificateNumber: certNumber,
                userId: res.userId,
                courseId: updated.courseId,
              },
            })

            await createNotification({
              userId: res.userId,
              title: "Certificate Issued 🎓",
              message: `Congratulations! You earned a certificate for "${existing.course.title}".`,
              type: "SUCCESS",
              link: "/dashboard/certificates",
            })

            await prisma.enrollment.updateMany({
              where: { userId: res.userId, courseId: updated.courseId },
              data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
            })
          }
        }
      }

      // Notify non-passing learners as well
      const failedResults = await prisma.assessmentResult.findMany({
        where: { assessmentId: id, passed: false, gradedAt: { not: null } },
      })
      for (const res of failedResults) {
        await createNotification({
          userId: res.userId,
          title: "Exam Results Released 📢",
          message: `Your results for "${updated.title}" have been released (Score: ${res.score.toFixed(0)}%).`,
          type: "INFO",
          link: "/dashboard/assessments",
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid assessment update" }, { status: 400 })
    }
    console.error("Update assessment error:", error)
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const existing = await prisma.assessment.findUnique({
      where: { id },
      select: { course: { select: { instructorId: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    if (!canManageOwnedResource(user, existing.course.instructorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    await prisma.$transaction(async tx => {
      await lockAssessment(tx, id)
      await assertNoAssessmentAttempts(tx, id)
      await tx.assessment.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error("Delete assessment error:", error)
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 })
  }
}
