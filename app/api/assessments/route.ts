import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { canManageCourse } from "@/lib/authorization"
import { prisma } from "@/lib/prisma"

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

    const { title, description, type, courseId, timeLimit, passingScore, attempts, releaseScores, scoresReleasedAt } = await request.json()
    if (!title || !courseId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    if (!(await canManageCourse(user, courseId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        type: type || "REVIEWER",
        courseId,
        timeLimit,
        passingScore: passingScore || 70,
        attempts: attempts ?? null,
        releaseScores: releaseScores !== false,
        scoresReleasedAt: releaseScores ? null : (scoresReleasedAt ? new Date(scoresReleasedAt) : null),
      },
      include: { course: { select: { id: true, title: true, category: true } } },
    })
    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 })
  }
}
