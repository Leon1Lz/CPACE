import { describe, expect, it } from "vitest"
import { calculateFinalGrade, gradeSchema } from "@/lib/manual-grading"
import { evaluatePathSteps } from "@/lib/learning-path-progress"
const answers = [
  { id: "choice", points: 2, question: { type: "MULTIPLE_CHOICE", points: 2 } },
  { id: "essay", points: 0, question: { type: "ESSAY", points: 8 } },
]
describe("final manual grades", () => {
  it("includes manual and automatic points in the full denominator", () => expect(calculateFinalGrade(answers, [{ answerId: "essay", points: 5, feedback: "Good" }], 70)).toEqual({ score: 70, passed: true, earned: 7, total: 10 }))
  it("accepts explicit zero credit", () => expect(calculateFinalGrade(answers, [{ answerId: "essay", points: 0, feedback: "" }], 70).score).toBe(20))
  it("rejects extra credit above the maximum", () => expect(() => calculateFinalGrade(answers, [{ answerId: "essay", points: 9, feedback: "" }], 70)).toThrow())
  it("rejects missing marks", () => expect(() => calculateFinalGrade(answers, [], 70)).toThrow())
  it("rejects duplicate marks", () => expect(() => calculateFinalGrade(answers, [{ answerId: "essay", points: 4, feedback: "" }, { answerId: "essay", points: 4, feedback: "" }], 70)).toThrow())
  it("rejects marking an automatic answer", () => expect(() => calculateFinalGrade(answers, [{ answerId: "choice", points: 2, feedback: "" }], 70)).toThrow())
  it("rejects negative, infinite, or nonnumeric API points", () => {
    for (const points of [-1, Infinity, NaN, "5"]) expect(gradeSchema.safeParse({ answers: [{ answerId: "essay", points }] }).success).toBe(false)
  })
  it("limits feedback and rejects unknown fields", () => {
    expect(gradeSchema.safeParse({ answers: [{ answerId: "essay", points: 5, feedback: "x".repeat(2001) }] }).success).toBe(false)
    expect(gradeSchema.safeParse({ answers: [{ answerId: "essay", points: 5 }], score: 100 }).success).toBe(false)
  })
  it("does not reveal held scores through learning-path best scores", () => {
    const steps = [{ id: "step", type: "ASSESSMENT" as const, courseId: null, assessmentId: "essay", isRequired: true }]
    expect(evaluatePathSteps(steps, [], [{ assessmentId: "essay", passed: true, score: null }])[0].bestScore).toBeNull()
  })
})
