import { z } from "zod"

export const gradeSchema = z.object({ answers: z.array(z.object({
  answerId: z.string().min(1).max(100),
  points: z.number().finite().min(0),
  feedback: z.string().trim().max(2000).default(""),
}).strict()).min(1).max(500) }).strict()

export const isWrittenQuestion = (type: string) => type === "SHORT_ANSWER" || type === "ESSAY"

export function calculateFinalGrade(answers: { id: string; points: number; question: { type: string; points: number } }[], marks: z.infer<typeof gradeSchema>["answers"], passingScore: number) {
  const written = answers.filter(answer => isWrittenQuestion(answer.question.type))
  if (marks.length !== written.length || new Set(marks.map(mark => mark.answerId)).size !== marks.length)
    throw new Error("Grade every written answer exactly once.")
  for (const mark of marks) {
    const answer = written.find(answer => answer.id === mark.answerId)
    if (!answer || mark.points > answer.question.points) throw new Error("Points must not exceed the question maximum; only written answers can be graded.")
  }
  const total = answers.reduce((sum, answer) => sum + answer.question.points, 0)
  const earned = answers.reduce((sum, answer) => sum + (isWrittenQuestion(answer.question.type) ? marks.find(mark => mark.answerId === answer.id)!.points : answer.points), 0)
  const score = total > 0 ? earned / total * 100 : 0
  return { score, passed: score >= passingScore, earned, total }
}
