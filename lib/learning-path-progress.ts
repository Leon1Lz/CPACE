export type PathStep = {
  id: string
  type: "COURSE" | "ASSESSMENT"
  courseId: string | null
  assessmentId: string | null
  isRequired: boolean
  title?: string | null
  course?: { title: string } | null
  assessment?: { title: string; courseId?: string } | null
}
export type PathEnrollment = { courseId: string; status: string; progress: number }
export type PathResult = { assessmentId: string; passed: boolean; score: number | null }

export function calculateModuleProgress(completedCount: number, moduleCount: number) {
  if (moduleCount <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor(completedCount / moduleCount * 100)))
}

export function evaluatePathSteps<T extends PathStep>(steps: T[], enrollments: PathEnrollment[], results: PathResult[]) {
  let blocked = false
  return steps.map(step => {
    const enrollment = enrollments.find(item => item.courseId === step.courseId)
    const attempts = results.filter(item => item.assessmentId === step.assessmentId)
    const visibleScores = attempts.map(attempt => attempt.score).filter((score): score is number => score !== null)
    const completed = step.type === "COURSE"
      ? enrollment?.status === "COMPLETED" || (enrollment?.status === "ACTIVE" && enrollment.progress >= 100)
      : attempts.some(attempt => attempt.passed)
    const locked = blocked && !completed
    if (step.isRequired && !completed) blocked = true
    return {
      ...step, completed, locked,
      progress: step.type === "COURSE" ? Math.max(0, Math.min(100, Math.round(enrollment?.progress ?? 0))) : completed ? 100 : 0,
      bestScore: visibleScores.length ? Math.max(...visibleScores) : null,
      href: step.type === "COURSE" ? `/dashboard/courses/${step.courseId}` : `/dashboard/assessments/${step.assessmentId}/take`,
    }
  })
}

type EvaluatedPath = {
  id: string; title: string
  steps: Array<PathStep & { completed: boolean; locked: boolean; href: string }>
}
export type PathTarget = { courseId: string; assessmentId?: string }

export function findLearningPathBlocker(paths: EvaluatedPath[], target: PathTarget) {
  const candidates = paths.flatMap(path => {
    const explicit = target.assessmentId
      ? path.steps.filter(step => step.type === "ASSESSMENT" && step.assessmentId === target.assessmentId)
      : []
    const matching = explicit.length ? explicit : path.steps.filter(step => step.type === "COURSE" && step.courseId === target.courseId)
    return matching.map(step => ({ path, step }))
  })
  if (!candidates.length || candidates.some(({ step }) => !step.locked)) return null
  const { path, step } = candidates[0]
  const targetIndex = path.steps.findIndex(item => item.id === step.id)
  const prerequisite = path.steps.slice(0, targetIndex).find(item => item.isRequired && !item.completed)
  if (!prerequisite) return null
  const title = prerequisite.title || prerequisite.course?.title || prerequisite.assessment?.title || "the previous required step"
  return {
    code: "LEARNING_PATH_LOCKED",
    error: `Complete "${title}" in "${path.title}" before opening this learning step.`,
    pathId: path.id,
    prerequisite: { id: prerequisite.id, title, href: prerequisite.href },
  }
}

export function summarizePathCompletion(steps: Array<{ completed: boolean; isRequired: boolean }>) {
  const required = steps.filter(step => step.isRequired)
  const counted = required.length ? required : steps
  const completedCount = counted.filter(step => step.completed).length
  return {
    progress: counted.length ? Math.round(completedCount / counted.length * 100) : 0,
    completed: counted.length > 0 && completedCount === counted.length,
    completedSteps: steps.filter(step => step.completed).length,
  }
}
