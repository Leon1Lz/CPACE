import { prisma } from "@/lib/prisma"
import { evaluatePathSteps, findLearningPathBlocker, type PathTarget } from "@/lib/learning-path-progress"

export async function getLearningPathBlocker(userId: string, target: PathTarget) {
  const paths = await prisma.learningPath.findMany({
    where: {
      isPublished: true,
      groups: { some: { group: { members: { some: { userId } } } } },
      steps: { some: { OR: [
        { type: "COURSE", courseId: target.courseId },
        ...(target.assessmentId ? [{ type: "ASSESSMENT" as const, assessmentId: target.assessmentId }] : []),
      ] } },
    },
    select: {
      id: true, title: true,
      steps: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: { course: { select: { title: true } }, assessment: { select: { title: true } } },
      },
    },
    orderBy: { id: "asc" },
  })
  if (!paths.length) return null
  const [enrollments, results] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true, status: true, progress: true } }),
    prisma.assessmentResult.findMany({ where: { userId, completedAt: { not: null }, gradedAt: { not: null } }, select: { assessmentId: true, passed: true, score: true } }),
  ])
  return findLearningPathBlocker(paths.map(path => ({ ...path, steps: evaluatePathSteps(path.steps, enrollments, results) })), target)
}
