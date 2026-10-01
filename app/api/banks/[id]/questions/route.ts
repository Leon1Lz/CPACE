import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
})

const bankQuestionSchema = z.object({
  question: z.string().min(1),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]).default("MULTIPLE_CHOICE"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  points: z.number().min(0).default(1.0),
  topic: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).default([]),
  explanation: z.string().nullable().optional(),
  formula: z.string().nullable().optional(),
  options: z.array(optionSchema).optional(),
})

const bulkImportSchema = z.object({
  questions: z.array(bankQuestionSchema).min(1).max(500),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id: bankId } = await params
    const { searchParams } = new URL(req.url)
    const difficulty = searchParams.get("difficulty") ?? undefined
    const topic = searchParams.get("topic") ?? undefined
    const search = searchParams.get("search")?.trim() ?? undefined

    const questions = await prisma.bankQuestion.findMany({
      where: {
        bankId,
        ...(difficulty && difficulty !== "ALL" && { difficulty: difficulty as "EASY" | "MEDIUM" | "HARD" }),
        ...(topic && topic !== "ALL" && { topic }),
        ...(search && {
          OR: [
            { question: { contains: search, mode: "insensitive" } },
            { explanation: { contains: search, mode: "insensitive" } },
            { topic: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        options: { orderBy: { order: "asc" } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error("GET /api/banks/[id]/questions error:", error)
    return NextResponse.json({ error: "Failed to fetch questions from bank" }, { status: 500 })
  }
}

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

    const { id: bankId } = await params

    // Verify bank exists
    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } })
    if (!bank) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 })
    }

    const body = await req.json()

    // Handle Bulk Import
    if (body.questions && Array.isArray(body.questions)) {
      const parsedBulk = bulkImportSchema.parse(body)
      const currentCount = await prisma.bankQuestion.count({ where: { bankId } })

      const created = await prisma.$transaction(
        parsedBulk.questions.map((q, index) =>
          prisma.bankQuestion.create({
            data: {
              bankId,
              question: q.question,
              type: q.type,
              difficulty: q.difficulty,
              points: q.points,
              topic: q.topic || null,
              tags: q.tags || [],
              explanation: q.explanation || null,
              formula: q.formula || null,
              order: currentCount + index + 1,
              ...(q.options && q.options.length > 0 && {
                options: {
                  create: q.options.map((opt, optIdx) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: optIdx + 1,
                  })),
                },
              }),
            },
            include: { options: { orderBy: { order: "asc" } } },
          })
        )
      )

      return NextResponse.json({
        imported: created.length,
        message: `Successfully imported ${created.length} question${created.length === 1 ? "" : "s"} into bank.`,
      })
    }

    // Handle Single Question Create
    const parsed = bankQuestionSchema.parse(body)
    const count = await prisma.bankQuestion.count({ where: { bankId } })

    const question = await prisma.bankQuestion.create({
      data: {
        bankId,
        question: parsed.question,
        type: parsed.type,
        difficulty: parsed.difficulty,
        points: parsed.points,
        topic: parsed.topic || null,
        tags: parsed.tags || [],
        explanation: parsed.explanation || null,
        formula: parsed.formula || null,
        order: count + 1,
        ...(parsed.options && parsed.options.length > 0 && {
          options: {
            create: parsed.options.map((opt, idx) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: idx + 1,
            })),
          },
        }),
      },
      include: { options: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid question data", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/banks/[id]/questions error:", error)
    return NextResponse.json({ error: "Failed to create question in bank" }, { status: 500 })
  }
}
