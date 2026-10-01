import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
})

const updateQuestionSchema = z.object({
  question: z.string().min(1).optional(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  points: z.number().min(0).optional(),
  topic: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
  explanation: z.string().nullable().optional(),
  formula: z.string().nullable().optional(),
  options: z.array(optionSchema).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id: bankId, questionId } = await params
    const body = await req.json()
    const parsed = updateQuestionSchema.parse(body)

    const existing = await prisma.bankQuestion.findFirst({
      where: { id: questionId, bankId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Bank question not found" }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If options are provided, replace them
      if (parsed.options) {
        await tx.bankQuestionOption.deleteMany({ where: { questionId } })
        if (parsed.options.length > 0) {
          await tx.bankQuestionOption.createMany({
            data: parsed.options.map((opt, idx) => ({
              questionId,
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: idx + 1,
            })),
          })
        }
      }

      return tx.bankQuestion.update({
        where: { id: questionId },
        data: {
          ...(parsed.question && { question: parsed.question }),
          ...(parsed.type && { type: parsed.type }),
          ...(parsed.difficulty && { difficulty: parsed.difficulty }),
          ...(parsed.points !== undefined && { points: parsed.points }),
          ...(parsed.topic !== undefined && { topic: parsed.topic }),
          ...(parsed.tags && { tags: parsed.tags }),
          ...(parsed.explanation !== undefined && { explanation: parsed.explanation }),
          ...(parsed.formula !== undefined && { formula: parsed.formula }),
        },
        include: {
          options: { orderBy: { order: "asc" } },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid question data", details: error.errors }, { status: 400 })
    }
    console.error("PATCH /api/banks/[id]/questions/[questionId] error:", error)
    return NextResponse.json({ error: "Failed to update bank question" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id: bankId, questionId } = await params

    const existing = await prisma.bankQuestion.findFirst({
      where: { id: questionId, bankId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Bank question not found" }, { status: 404 })
    }

    await prisma.bankQuestion.delete({
      where: { id: questionId },
    })

    return NextResponse.json({ success: true, message: "Question removed from bank" })
  } catch (error) {
    console.error("DELETE /api/banks/[id]/questions/[questionId] error:", error)
    return NextResponse.json({ error: "Failed to delete question from bank" }, { status: 500 })
  }
}
