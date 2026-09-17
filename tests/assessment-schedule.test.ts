import { describe, expect, it } from "vitest"
import { assessmentScheduleError, localDateTime } from "@/lib/assessment-schedule"
import { editableQuestionSchema } from "@/lib/question-input"

describe("assessment scheduling and question validation", () => {
  const now = new Date("2026-09-17T10:00:00Z")
  it("leaves unscheduled assessments available", () => expect(assessmentScheduleError({}, now)).toBeNull())
  it("denies attempts before opening", () => expect(assessmentScheduleError({ startsAt: new Date(now.getTime() + 1) }, now)).toContain("not opened"))
  it("allows attempts exactly at opening", () => expect(assessmentScheduleError({ startsAt: now }, now)).toBeNull())
  it("closes attempts exactly at ending", () => expect(assessmentScheduleError({ endsAt: now }, now)).toContain("closed"))
  it("formats blank and local dates for datetime inputs", () => {
    expect(localDateTime(null)).toBe("")
    expect(localDateTime(new Date(2026, 8, 17, 18, 30))).toBe("2026-09-17T18:30")
  })
  const question = { question: "Edited question", type: "MULTIPLE_CHOICE", points: 0, options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }] }
  it("accepts editable choices including zero points", () => expect(editableQuestionSchema.parse(question).points).toBe(0))
  it("rejects no correct answer", () => expect(editableQuestionSchema.safeParse({ ...question, options: question.options.map(option => ({ ...option, isCorrect: false })) }).success).toBe(false))
  it("rejects multiple correct answers", () => expect(editableQuestionSchema.safeParse({ ...question, options: question.options.map(option => ({ ...option, isCorrect: true })) }).success).toBe(false))
  it("rejects three true/false choices", () => expect(editableQuestionSchema.safeParse({ ...question, type: "TRUE_FALSE", options: [...question.options, { text: "C", isCorrect: false }] }).success).toBe(false))
  it("rejects blank question text", () => expect(editableQuestionSchema.safeParse({ ...question, question: "   " }).success).toBe(false))
  it("accepts written questions without options", () => expect(editableQuestionSchema.safeParse({ question: "Write an answer", type: "ESSAY", points: 5 }).success).toBe(true))
})
