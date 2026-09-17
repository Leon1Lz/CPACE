import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { z } from "zod"
import { examExpired } from "@/lib/assessment-timing"
import { AssessmentIntegrityError } from "@/lib/assessment-integrity"

const draftSchema = z.object({
  sessionId: z.string().min(1).max(100),
  version: z.number().int().min(0),
  answers: z.record(z.string().min(1).max(100), z.object({
    selectedOptionId: z.string().min(1).max(100).optional(),
    content: z.string().max(10000).optional(),
  }).strict()).refine(value => Object.keys(value).length <= 500),
}).strict()

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getServerSession(authOptions)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!user || user.role !== "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id } = await params
    const body = draftSchema.parse(await request.json())
    const assessment = await prisma.assessment.findUnique({ where: { id },
      include: { questions: { select: { id: true, options: { select: { id: true } } } } } })
    if (!assessment?.isPublished) return NextResponse.json({ error: "Assessment unavailable" }, { status: 403 })
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: assessment.courseId } } })
    if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status))
      return NextResponse.json({ error: "Enrollment required" }, { status: 403 })
    const blocker = await getLearningPathBlocker(user.id, { courseId: assessment.courseId, assessmentId: id })
    if (blocker) return NextResponse.json(blocker, { status: 403 })
    for (const [questionId, answer] of Object.entries(body.answers)) {
      const question = assessment.questions.find(q => q.id === questionId)
      if (!question || (answer.selectedOptionId && !question.options.some(o => o.id === answer.selectedOptionId)))
        return NextResponse.json({ error: "Invalid question or option" }, { status: 400 })
    }
    await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "exam_sessions" WHERE "id" = ${body.sessionId} AND "userId" = ${user.id} AND "assessmentId" = ${id} FOR UPDATE`
    const existing = await tx.examSession.findFirst({ where: {
      id: body.sessionId, userId: user.id, assessmentId: id, status: "IN_PROGRESS",
    }, select: { draftAnswers: true, draftVersion: true, deadlineAt: true } })
    if (!existing) throw new AssessmentIntegrityError("Attempt changed or was submitted. Please review your saved attempt.")
    const normalized = (value: unknown) => JSON.stringify(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b)).map(([key, answer]) => [key, Object.entries(answer as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))]))
    // An identical retry acknowledges a pre-deadline save without another write.
    if (existing.draftVersion === body.version + 1 && normalized(existing.draftAnswers) === normalized(body.answers)) return
    if (examExpired(existing.deadlineAt)) throw new AssessmentIntegrityError("Exam time has ended. Submit to recover the last answers saved before the deadline.")
    if (existing.draftVersion !== body.version) throw new AssessmentIntegrityError("Attempt changed or was submitted. Keep this page open and review the saved copy before reloading.")
    const saved = await tx.examSession.updateMany({
      where: { id: body.sessionId, userId: user.id, assessmentId: id, status: "IN_PROGRESS", draftVersion: body.version },
      data: { draftAnswers: body.answers, draftVersion: { increment: 1 } },
    })
    if (saved.count !== 1) throw new AssessmentIntegrityError("Attempt changed. Please retry or review your saved attempt.")
    })
    return NextResponse.json({ version: body.version + 1 }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 })
    console.error("Draft save error:", error)
    return NextResponse.json({ error: "Answers could not be saved" }, { status: 500 })
  }
}
