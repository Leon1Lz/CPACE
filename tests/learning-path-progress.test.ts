import { describe, expect, it } from "vitest"
import { calculateModuleProgress, evaluatePathSteps, findLearningPathBlocker, summarizePathCompletion, type PathStep } from "@/lib/learning-path-progress"

const courseStep: PathStep = { id: "step-course", type: "COURSE", courseId: "course-1", assessmentId: null, isRequired: true, course: { title: "Foundation course" } }
const examStep: PathStep = { id: "step-exam", type: "ASSESSMENT", courseId: null, assessmentId: "exam-1", isRequired: true, assessment: { title: "Final exam", courseId: "course-1" } }
const makePath = (steps: PathStep[], enrollments: Parameters<typeof evaluatePathSteps>[1] = [], results: Parameters<typeof evaluatePathSteps>[2] = []) => ({
  id: "path-1", title: "Certification journey", steps: evaluatePathSteps(steps, enrollments, results),
})

describe("learning path prerequisites", () => {
  it("does not round an incomplete course up to 100 percent", () => {
    expect(calculateModuleProgress(199, 200)).toBe(99)
    expect(calculateModuleProgress(200, 200)).toBe(100)
    expect(calculateModuleProgress(0, 0)).toBe(0)
  })
  it("locks a later assessment while its required course is incomplete", () => {
    const path = makePath([courseStep, examStep])
    const blocker = findLearningPathBlocker([path], { courseId: "course-1", assessmentId: "exam-1" })
    expect(blocker?.code).toBe("LEARNING_PATH_LOCKED")
    expect(blocker?.prerequisite.title).toBe("Foundation course")
    expect(blocker?.prerequisite.href).toBe("/dashboard/courses/course-1")
  })

  it("unlocks the final exam after completing course content", () => {
    const path = makePath([courseStep, examStep], [{ courseId: "course-1", status: "COMPLETED", progress: 100 }])
    expect(findLearningPathBlocker([path], { courseId: "course-1", assessmentId: "exam-1" })).toBeNull()
  })

  it("does not let optional steps block required later steps", () => {
    const path = makePath([{ ...courseStep, isRequired: false }, examStep])
    expect(path.steps[1].locked).toBe(false)
  })

  it("counts required completion without requiring optional enrichment", () => {
    const path = makePath([{ ...courseStep, isRequired: false }, examStep], [], [{ assessmentId: "exam-1", passed: true, score: 90 }])
    expect(summarizePathCompletion(path.steps)).toEqual({ completed: true, progress: 100, completedSteps: 1 })
  })

  it("keeps already completed steps available for review", () => {
    const path = makePath([courseStep, examStep], [], [{ assessmentId: "exam-1", passed: true, score: 90 }])
    expect(findLearningPathBlocker([path], { courseId: "course-1", assessmentId: "exam-1" })).toBeNull()
  })

  it("does not unlock an assessment after a failed attempt", () => {
    const path = makePath([examStep, courseStep], [], [{ assessmentId: "exam-1", passed: false, score: 20 }])
    expect(findLearningPathBlocker([path], { courseId: "course-1" })?.prerequisite.id).toBe("step-exam")
  })

  it("does not treat dropped enrollment progress as course completion", () => {
    const path = makePath([courseStep, examStep], [{ courseId: "course-1", status: "DROPPED", progress: 100 }])
    expect(path.steps[0].completed).toBe(false)
    expect(path.steps[1].locked).toBe(true)
  })

  it("inherits a locked parent course for assessments not explicitly listed", () => {
    const path = makePath([{ ...examStep, assessmentId: "entrance-exam" }, courseStep])
    expect(findLearningPathBlocker([path], { courseId: "course-1", assessmentId: "course-quiz" })).not.toBeNull()
  })

  it("allows a shared resource when another assigned path unlocks it", () => {
    const locked = makePath([courseStep, examStep])
    const unlocked = { ...makePath([examStep]), id: "path-2" }
    expect(findLearningPathBlocker([locked, unlocked], { courseId: "course-1", assessmentId: "exam-1" })).toBeNull()
  })

  it("leaves standalone resources and empty paths unaffected", () => {
    expect(findLearningPathBlocker([], { courseId: "standalone" })).toBeNull()
    expect(findLearningPathBlocker([makePath([courseStep, examStep])], { courseId: "other-course" })).toBeNull()
    expect(summarizePathCompletion([])).toEqual({ completed: false, progress: 0, completedSteps: 0 })
  })
})
