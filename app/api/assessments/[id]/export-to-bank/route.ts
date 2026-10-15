import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageOwnedResource } from "@/lib/authorization"
import { recordStaffAudit } from "@/lib/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, email: true, firstName: true, lastName: true },
    })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id: assessmentId } = await params
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        course: { select: { id: true, title: true, category: true, instructorId: true } },
        questions: {
          include: {
            options: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    if (!canManageOwnedResource(user, assessment.course.instructorId)) {
      return NextResponse.json({ error: "Forbidden: You do not own this course" }, { status: 403 })
    }

    if (assessment.questions.length === 0) {
      return NextResponse.json({ error: "This assessment has no questions to export." }, { status: 400 })
    }

    // 1. Find or create the Question Bank for this course
    let bank = await prisma.questionBank.findFirst({
      where: { courseId: assessment.courseId },
    })

    if (!bank) {
      bank = await prisma.questionBank.create({
        data: {
          courseId: assessment.courseId,
          title: `${assessment.course.title} Question Bank`,
          description: `Central item bank for ${assessment.course.title}`,
          code: `QB-${assessment.course.category || "GEN"}-01`,
        },
      })
    }

    // 2. Sync questions into the bank avoiding duplicates
    let addedCount = 0
    let existingCount = 0

    await prisma.$transaction(async (tx) => {
      const currentBankCount = await tx.bankQuestion.count({ where: { bankId: bank.id } })

      for (let i = 0; i < assessment.questions.length; i++) {
        const q = assessment.questions[i]
        const cleanQuestion = q.question.trim()

        const existing = await tx.bankQuestion.findFirst({
          where: { bankId: bank.id, question: cleanQuestion },
        })

        if (!existing) {
          await tx.bankQuestion.create({
            data: {
              bankId: bank.id,
              question: cleanQuestion,
              type: q.type,
              difficulty: "MEDIUM",
              points: q.points || 1.0,
              topic: assessment.title,
              order: currentBankCount + addedCount + 1,
              ...(q.options.length > 0 && {
                options: {
                  create: q.options.map((opt, optIdx) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: opt.order ?? optIdx + 1,
                  })),
                },
              }),
            },
          })
          addedCount++
        } else {
          existingCount++
        }
      }
    })

    await recordStaffAudit(
      user,
      "ASSESSMENT_EXPORT_TO_BANK",
      `Exported ${addedCount} questions from assessment "${assessment.title}" to Question Bank "${bank.title}" (${existingCount} already present)`
    )

    return NextResponse.json({
      success: true,
      bankId: bank.id,
      bankTitle: bank.title,
      addedCount,
      existingCount,
      totalAssessmentQuestions: assessment.questions.length,
      message: addedCount > 0
        ? `Successfully saved ${addedCount} question${addedCount === 1 ? "" : "s"} to "${bank.title}".`
        : `All ${existingCount} questions already exist in "${bank.title}".`,
    })
  } catch (error) {
    console.error("POST /api/assessments/[id]/export-to-bank error:", error)
    return NextResponse.json({ error: "Failed to export questions to question bank" }, { status: 500 })
  }
}
