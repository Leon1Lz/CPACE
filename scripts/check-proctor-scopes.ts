// Read-only database checks: no users, assignments, or exam records are created.
import "dotenv/config"
import { prisma } from "../lib/prisma"
import { buildProctorSessionScope, getSessionProctorRecipients } from "../lib/proctor-access"

async function main() {
  const [totalSessions, unassignedCoverage, groupScopedQuery, incidentQuery] = await Promise.all([
    prisma.examSession.count(),
    prisma.examSession.count({ where: buildProctorSessionScope([]) }),
    prisma.examSession.count({ where: buildProctorSessionScope([{ courseId: "__scope_check__", groupId: "__scope_check__" }]) }),
    prisma.proctoringEvent.count({ where: { session: buildProctorSessionScope([]), reviewStatus: { in: ["PENDING", "ESCALATED"] } } }),
  ])
  if (unassignedCoverage || groupScopedQuery || incidentQuery) throw new Error("Empty coverage returned records")
  const session = await prisma.examSession.findFirst({ select: { id: true } })
  const recipientCount = session ? (await getSessionProctorRecipients(session.id)).length : 0
  console.log(JSON.stringify({ totalSessions, unassignedCoverage, groupScopedQuery, incidentQuery, recipientQueryValidated: Boolean(session), recipientCount }))
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Scope check failed"); process.exitCode = 1 }).finally(() => prisma.$disconnect())
