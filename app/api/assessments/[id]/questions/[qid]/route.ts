import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageAssessment } from "@/lib/authorization"
import { editableQuestionSchema } from "@/lib/question-input"
import { z } from "zod"
import { withEditableAssessment, AssessmentIntegrityError } from "@/lib/assessment-integrity"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const { id: assessmentId, qid } = await params
    if (!user || !(await canManageAssessment(user, assessmentId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = editableQuestionSchema.parse(await request.json())
    const updated = await withEditableAssessment(assessmentId, async tx => {
      const question = await tx.question.findFirst({ where: { id: qid, assessmentId } })
      if (!question) throw new Error("Question not found")
      return tx.question.update({ where: { id: qid }, data: {
        question: body.question, type: body.type, points: body.points,
        options: { deleteMany: {}, create: (body.options ?? []).map((option, index) => ({ ...option, order: index + 1 })) },
      }, include: { options: { orderBy: { order: "asc" } } } })
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid question. Check text, points, options, and correct answer." }, { status: 400 })
    if (error instanceof Error && error.message === "Question not found")
      return NextResponse.json({ error: error.message }, { status: 404 })
    if (error instanceof Error && error.message.startsWith("Questions are locked"))
      return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json({ error: "Question could not be saved. Please retry." }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id: assessmentId, qid } = await params
    if (!(await canManageAssessment(user, assessmentId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const deleted = await withEditableAssessment(assessmentId, tx => tx.question.deleteMany({ where: { id: qid, assessmentId } }))
    if (!deleted.count) return NextResponse.json({ error: "Question not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
