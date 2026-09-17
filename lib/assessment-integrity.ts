import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export class AssessmentIntegrityError extends Error {
  constructor(message: string, public status = 409) { super(message) }
}

// Every start and question mutation takes this same DB row lock. Checking counts
// without it permits a question edit to race the first learner's session creation.
export async function lockAssessment(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "assessments" WHERE "id" = ${id} FOR UPDATE`
  if (!rows.length) throw new AssessmentIntegrityError("Assessment not found", 404)
}

export async function assertNoAssessmentAttempts(tx: Prisma.TransactionClient, id: string) {
  const assessment = await tx.assessment.findUnique({ where: { id }, select: { bankLockedAt: true } })
  const sessions = await tx.examSession.count({ where: { assessmentId: id } })
  const results = await tx.assessmentResult.count({ where: { assessmentId: id } })
  if (assessment?.bankLockedAt || sessions || results) throw new AssessmentIntegrityError("This assessment is locked because attempts exist. Create a new assessment to change questions; existing answers and results must be preserved.")
}

export async function withEditableAssessment<T>(id: string, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async tx => {
    await lockAssessment(tx, id)
    await assertNoAssessmentAttempts(tx, id)
    const result = await work(tx)
    await tx.assessment.update({ where: { id }, data: { questionVersion: { increment: 1 } } })
    return result
  })
}
