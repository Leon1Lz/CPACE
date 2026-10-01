import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBankSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  code: z.string().max(50).optional(),
  courseId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId") ?? undefined
    const search = searchParams.get("search")?.trim() ?? undefined

    const banks = await prisma.questionBank.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        course: { select: { id: true, title: true, category: true } },
        _count: { select: { questions: true, pools: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    })

    return NextResponse.json(banks)
  } catch (error) {
    console.error("GET /api/banks error:", error)
    return NextResponse.json({ error: "Failed to fetch question banks" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createBankSchema.parse(body)

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: parsed.courseId } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const bank = await prisma.questionBank.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        code: parsed.code || `QB-${course.category || "GEN"}-${Date.now().toString().slice(-4)}`,
        courseId: parsed.courseId,
      },
      include: {
        course: { select: { id: true, title: true, category: true } },
        _count: { select: { questions: true } },
      },
    })

    return NextResponse.json(bank, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid bank data", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/banks error:", error)
    return NextResponse.json({ error: "Failed to create question bank" }, { status: 500 })
  }
}
