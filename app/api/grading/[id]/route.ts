import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageOwnedResource } from "@/lib/authorization"
import { gradeSchema, calculateFinalGrade } from "@/lib/manual-grading"
import { AssessmentIntegrityError, lockAssessment } from "@/lib/assessment-integrity"
import { z } from "zod"
import { randomUUID } from "node:crypto"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user || !["ADMIN", "INSTRUCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id } = await params
    const body = gradeSchema.parse(await request.json())
    const saved = await prisma.$transaction(async tx => {
      const target = await tx.assessmentResult.findUnique({ where: { id }, select: { assessmentId: true } })
      if (!target) throw new AssessmentIntegrityError("Submission not found", 404)
      await lockAssessment(tx, target.assessmentId)
      const result = await tx.assessmentResult.findUniqueOrThrow({ where: { id }, include: {
        assessment: { include: { course: true, questions: { select: { id: true } } } }, answers: { include: { question: true } },
      } })
      if (!canManageOwnedResource(user, result.assessment.course.instructorId)) throw new AssessmentIntegrityError("Forbidden", 403)
      if (result.gradedAt) throw new AssessmentIntegrityError("This submission is already graded. Reload to see its finalized result.")
      if (!result.completedAt) throw new AssessmentIntegrityError("Only submitted attempts can be graded.")
      const questionIds = new Set(result.answers.map(answer => answer.questionId))
      if (questionIds.size !== result.assessment.questions.length || result.assessment.questions.some(question => !questionIds.has(question.id)))
        throw new AssessmentIntegrityError("This legacy submission has incomplete answer history and cannot be safely graded in this workflow.")
      let finalGrade
      try { finalGrade = calculateFinalGrade(result.answers, body.answers, result.assessment.passingScore) }
      catch (error) { throw new AssessmentIntegrityError(error instanceof Error ? error.message : "Invalid marks", 400) }
      for (const mark of body.answers) {
        const answer = result.answers.find(answer => answer.id === mark.answerId)!
        await tx.answer.update({ where: { id: mark.answerId }, data: { points: mark.points, feedback: mark.feedback || null, isCorrect: mark.points === answer.question.points } })
      }
      const now = new Date()
      await tx.assessmentResult.update({ where: { id }, data: { score: finalGrade.score, passed: finalGrade.passed, gradedAt: now, gradedById: user.id } })
      const released = result.assessment.releaseScores || Boolean(result.assessment.scoresReleasedAt && result.assessment.scoresReleasedAt <= now)
      if (released && finalGrade.passed && result.assessment.type === "FINAL_EXAM") {
        const certificate = await tx.certificate.findFirst({ where: { userId: result.userId, courseId: result.assessment.courseId } })
        if (!certificate) await tx.certificate.create({ data: {
          userId: result.userId, courseId: result.assessment.courseId,
          title: `Certificate of Completion — ${result.assessment.course.title}`,
          certificateNumber: `CPACE-${randomUUID()}`,
        } })
        await tx.enrollment.updateMany({ where: { userId: result.userId, courseId: result.assessment.courseId, status: { in: ["ACTIVE", "COMPLETED"] } }, data: { status: "COMPLETED", progress: 100, completedAt: now } })
      }
      await tx.notification.create({ data: { userId: result.userId, title: released ? "Assessment graded" : "Assessment review completed", message: released ? `Your result for "${result.assessment.title}" is available.` : `Your submission for "${result.assessment.title}" has been reviewed. Scores remain held until release.`, type: "INFO", link: "/dashboard/reports" } })
      return { resultId: id, score: finalGrade.score, passed: finalGrade.passed, gradedAt: now }
    }, { isolationLevel: "Serializable" })
    return NextResponse.json(saved)
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid grades or feedback" }, { status: 400 })
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") return NextResponse.json({ error: "Another reviewer changed this attempt. Reload and retry." }, { status: 409 })
    return NextResponse.json({ error: "Grades were not saved. Please retry." }, { status: 500 })
  }
}
