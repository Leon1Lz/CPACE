import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluatePathSteps, findLearningPathBlocker, summarizePathCompletion } from "@/lib/learning-path-progress"

const pathInclude = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  groups: { include: { group: { select: { id: true, name: true } } } },
  steps: {
    orderBy: { order: "asc" as const },
    include: {
      course: { select: { id: true, title: true, category: true, thumbnail: true } },
      assessment: { select: { id: true, title: true, type: true, passingScore: true, courseId: true, course: { select: { title: true } } } },
    },
  },
  _count: { select: { steps: true, groups: true } },
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (user.role !== "LEARNER") {
      if (user.role === "PROCTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      const paths = await prisma.learningPath.findMany({
        where: user.role === "ADMIN" ? undefined : { creatorId: user.id },
        include: pathInclude,
        orderBy: { updatedAt: "desc" },
      })
      return NextResponse.json(paths)
    }

    const [paths, enrollments, results] = await Promise.all([
      prisma.learningPath.findMany({
        where: {
          isPublished: true,
          groups: { some: { group: { members: { some: { userId: user.id } } } } },
        },
        include: pathInclude,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true, progress: true, status: true } }),
      prisma.assessmentResult.findMany({ where: { userId: user.id, completedAt: { not: null }, gradedAt: { not: null } }, select: { assessmentId: true, passed: true, score: true, completedAt: true, assessment: { select: { releaseScores: true, scoresReleasedAt: true } } } }),
    ])
    const safeResults = results.map(result => ({ ...result, score: result.assessment.releaseScores || (result.assessment.scoresReleasedAt && result.assessment.scoresReleasedAt <= new Date()) ? result.score : null }))
    const evaluatedPaths = paths.map(path => ({ ...path, steps: evaluatePathSteps(path.steps, enrollments, safeResults) }))
    const learnerPaths = evaluatedPaths.map((path) => {
      const steps = path.steps.map(step => ({
        ...step,
        locked: !!findLearningPathBlocker(evaluatedPaths, {
          courseId: step.courseId || step.assessment?.courseId || "",
          ...(step.type === "ASSESSMENT" && step.assessmentId ? { assessmentId: step.assessmentId } : {}),
        }),
      }))
      const currentStep = steps.find((step) => !step.completed && !step.locked) ?? null
      return {
        ...path,
        steps,
        currentStepId: currentStep?.id ?? null,
        ...summarizePathCompletion(steps),
      }
    })
    return NextResponse.json(learnerPaths)
  } catch (error) {
    console.error("Learning paths GET error:", error)
    return NextResponse.json({ error: "Failed to load learning paths" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !["ADMIN", "INSTRUCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { title, description } = await request.json()
    if (!title?.trim()) return NextResponse.json({ error: "Path title is required" }, { status: 400 })
    const path = await prisma.learningPath.create({
      data: { title: title.trim(), description: description?.trim() || null, creatorId: user.id },
      include: pathInclude,
    })
    await prisma.auditLog.create({ data: { actorId: user.id, actorName: `${user.firstName} ${user.lastName}`, actorEmail: user.email, action: "LEARNING_PATH_CREATE", category: "STAFF", details: `Created learning path "${path.title}"` } }).catch(() => undefined)
    return NextResponse.json(path, { status: 201 })
  } catch (error) {
    console.error("Learning paths POST error:", error)
    return NextResponse.json({ error: "Failed to create learning path" }, { status: 500 })
  }
}
