import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { canManageCourse } from "@/lib/authorization"
import { prisma } from "@/lib/prisma"
import { sanitizeHtml, stripTags } from "@/lib/sanitize"
import { z } from "zod"

const assessmentCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(20000).nullable().optional(),
  type: z.enum(["REVIEWER", "PRACTICE_EXAM", "RULES_GUIDELINES", "FINAL_EXAM", "QUIZ", "ASSIGNMENT"]).optional().default("REVIEWER"),
  courseId: z.string().min(1, "Course is required"),
  timeLimit: z.number().int().min(1).max(1440).nullable().optional(),
  passingScore: z.number().min(0).max(100).optional().default(70),
  attempts: z.number().int().min(1).max(100).nullable().optional(),
  releaseScores: z.boolean().optional().default(true),
  scoresReleasedAt: z.string().datetime({ offset: true }).nullable().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"))
    const skip = (page - 1) * limit

    const courseId = searchParams.get("courseId") ?? undefined

    let where: any = {}
    let extraInclude: any = {}

    if (user.role === "LEARNER") {
      where = { isPublished: true, course: { enrollments: { some: { userId: user.id } } } }
      extraInclude = { results: { where: { userId: user.id }, select: { id: true, score: true, passed: true, completedAt: true, gradedAt: true } } }
    } else if (user.role === "INSTRUCTOR") {
      where = { course: { instructorId: user.id } }
    }

    if (courseId) {
      where.courseId = courseId
    }

    const commonInclude = {
      course: { select: { id: true, title: true, category: true } },
      _count: { select: { questions: true, results: user.role === "LEARNER" ? { where: { userId: user.id } } : true } },
      ...extraInclude,
    }

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({ where, include: commonInclude, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.assessment.count({ where }),
    ])

    if (user.role === "LEARNER") {
      const processed = assessments.map((a: any) => {
        const released = a.releaseScores !== false || (a.scoresReleasedAt && new Date() >= new Date(a.scoresReleasedAt))
        if (a.results) {
          return {
            ...a,
            results: a.results.map((r: any) => (!released || !r.gradedAt) ? ({
              ...r,
              score: null,
              passed: null,
              scoresPending: true,
              gradingPending: !r.gradedAt,
            }) : r),
          }
        }
        return a
      })
      return NextResponse.json({ data: processed, total, page, limit, totalPages: Math.ceil(total / limit) })
    }

    return NextResponse.json({ data: assessments, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = assessmentCreateSchema.parse(await request.json())
    if (!(await canManageCourse(user, body.courseId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let cleanDescription: string | null = null
    if (body.description != null) {
      const sanitized = sanitizeHtml(body.description)
      if (stripTags(sanitized).length > 5000) {
        return NextResponse.json({ error: "Description is too long" }, { status: 400 })
      }
      cleanDescription = stripTags(sanitized).trim() ? sanitized : null
    }

    const assessment = await prisma.assessment.create({
      data: {
        title: body.title,
        description: cleanDescription,
        type: body.type,
        courseId: body.courseId,
        timeLimit: body.timeLimit ?? null,
        passingScore: body.passingScore,
        attempts: body.attempts ?? null,
        releaseScores: body.releaseScores,
        scoresReleasedAt: body.releaseScores ? null : (body.scoresReleasedAt ? new Date(body.scoresReleasedAt) : null),
      },
      include: { course: { select: { id: true, title: true, category: true } } },
    })
    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]?.message || "Invalid input"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 })
  }
}
