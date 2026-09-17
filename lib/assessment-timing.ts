export function examDeadline(startedAt: Date, timeLimit?: number | null) {
  return timeLimit ? new Date(startedAt.getTime() + timeLimit * 60000) : null
}

export function examExpired(deadlineAt?: Date | null, now = new Date()) {
  return Boolean(deadlineAt && now >= deadlineAt)
}

export type SubmittedAnswer = { questionId: string; selectedOptionId?: string; content?: string }

// Only server-persisted answers may be graded once the attempt's deadline passes.
export function submissionAnswers(answers: SubmittedAnswer[], draft: unknown, expired: boolean): SubmittedAnswer[] {
  if (!expired) return answers
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return []
  return Object.entries(draft).map(([questionId, value]) => {
    const answer = value && typeof value === "object" ? value as Record<string, unknown> : {}
    return { questionId,
      ...(typeof answer.selectedOptionId === "string" ? { selectedOptionId: answer.selectedOptionId } : {}),
      ...(typeof answer.content === "string" ? { content: answer.content } : {}),
    }
  })
}
