import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { canManageAssessment } from "@/lib/authorization"
import { withEditableAssessment } from "@/lib/assessment-integrity"

const importSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1).max(200),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id: assessmentId } = await params
    if (!(await canManageAssessment(user, assessmentId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { questionIds } = importSchema.parse(body)

    // Fetch the bank questions
    const bankQuestions = await prisma.bankQuestion.findMany({
      where: { id: { in: questionIds } },
      include: {
        options: { orderBy: { order: "asc" } },
      },
    })

    if (bankQuestions.length === 0) {
      return NextResponse.json({ error: "No valid bank questions found to import" }, { status: 404 })
    }

    // Insert into assessment questions under lock
    const importedCount = await withEditableAssessment(assessmentId, async (tx) => {
      const currentCount = await tx.question.count({ where: { assessmentId } })

      let added = 0
      for (let i = 0; i < bankQuestions.length; i++) {
        const bq = bankQuestions[i]
        await tx.question.create({
          data: {
            assessmentId,
            question: bq.question,
            type: bq.type,
            points: bq.points,
            order: currentCount + i + 1,
            ...(bq.options.length > 0 && {
              options: {
                create: bq.options.map((opt, optIdx) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  order: optIdx + 1,
                })),
              },
            }),
          },
        })
        added++
      }

      // Update timesUsed metric on bank questions
      await tx.bankQuestion.updateMany({
        where: { id: { in: questionIds } },
        data: { timesUsed: { increment: 1 } },
      })

      return added
    })

    return NextResponse.json({
      success: true,
      imported: importedCount,
      message: `Successfully imported ${importedCount} question${importedCount === 1 ? "" : "s"} from test bank into assessment.`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid import request", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/assessments/[id]/import-from-bank error:", error)
    return NextResponse.json({ error: "Failed to import questions from test bank" }, { status: 500 })
  }
}
