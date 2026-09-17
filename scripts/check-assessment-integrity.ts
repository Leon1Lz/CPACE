import "dotenv/config"
import { prisma } from "../lib/prisma"
import { lockAssessment, assertNoAssessmentAttempts, AssessmentIntegrityError } from "../lib/assessment-integrity"

async function main() {
  const [sessions, deadlines, unmarkedHistory, protectedAssessment] = await Promise.all([
    prisma.examSession.count(),
    prisma.examSession.count({ where: { deadlineAt: { not: null } } }),
    prisma.assessment.count({ where: { bankLockedAt: null, OR: [{ examSessions: { some: {} } }, { results: { some: {} } }] } }),
    prisma.assessment.findFirst({ where: { bankLockedAt: { not: null } }, select: { id: true } }),
  ])
  let guardVerified = false
  const pendingWhere = { completedAt: { not: null }, gradedAt: null, assessment: { questions: { some: { type: { in: ["SHORT_ANSWER", "ESSAY"] as ("SHORT_ANSWER" | "ESSAY")[] } } } } }
  const pendingManual = await prisma.assessmentResult.count({ where: pendingWhere })
  const queue = await prisma.assessmentResult.findMany({ where: pendingWhere, take: 25, orderBy: [{ completedAt: "asc" }, { id: "asc" }],
    select: { id: true, answers: { orderBy: { question: { order: "asc" } }, select: { id: true, points: true, feedback: true, question: { select: { type: true, points: true } } } } } })
  if (protectedAssessment) {
    await prisma.$transaction(async tx => {
      await lockAssessment(tx, protectedAssessment.id)
      try { await assertNoAssessmentAttempts(tx, protectedAssessment.id) }
      catch (error) { if (error instanceof AssessmentIntegrityError && error.status === 409) guardVerified = true; else throw error }
    })
  }
  console.log(JSON.stringify({ sessions, deadlineSnapshots: deadlines, unmarkedHistory, protectedGuardVerified: guardVerified, pendingManual, queueQueryRows: queue.length, mutations: 0 }))
  if (unmarkedHistory || (protectedAssessment && !guardVerified)) process.exitCode = 1
}
main().catch(() => { console.error("Assessment integrity checks failed"); process.exitCode = 1 }).finally(() => prisma.$disconnect())
