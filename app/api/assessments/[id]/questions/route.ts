import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
})

const questionSchema = z.object({
  question: z.string().min(1),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]).default("MULTIPLE_CHOICE"),
  points: z.number().min(0).default(1),
  options: z.array(optionSchema).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: assessmentId } = await params

    const questions = await prisma.question.findMany({
      where: { assessmentId },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(questions)
  } catch {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id: assessmentId } = await params
    const body = await request.json()
    const { question, type, points, options } = questionSchema.parse(body)

    // Get current question count for order
    const count = await prisma.question.count({ where: { assessmentId } })

    const created = await prisma.question.create({
      data: {
        question,
        type,
        points,
        order: count + 1,
        assessmentId,
        ...(options && options.length > 0 && {
          options: {
            create: options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i + 1 })),
          },
        }),
      },
      include: { options: { orderBy: { order: "asc" } } },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
