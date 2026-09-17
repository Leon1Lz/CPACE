// Read-only aggregation checks. Outputs counts only, not learner identities or scores.
import "dotenv/config"
import { prisma } from "../lib/prisma"
import { parseReportRange } from "../lib/reporting"
import { getEnrollmentActivity } from "../lib/reporting-data"

async function main() {
  const range = parseReportRange(new URLSearchParams({ start: "2026-01-01" }))
  const where = { enrolledAt: { gte: range.from, lt: range.until } }
  const [activity, enrollmentCount, courseGroups, attempts, eligible, learnerScope] = await Promise.all([
    getEnrollmentActivity(range), prisma.enrollment.count({ where }),
    prisma.enrollment.groupBy({ by: ["courseId", "status"], where, _count: { id: true } }),
    prisma.assessmentResult.groupBy({ by: ["assessmentId"], where: { completedAt: { gte: range.from, lt: range.until } }, _count: { id: true } }),
    prisma.assessmentResult.aggregate({ where: { AND: [{ completedAt: { gte: range.from, lt: range.until } }, { assessment: { OR: [{ releaseScores: true }, { scoresReleasedAt: { lte: new Date() } }] } }, { gradedAt: { not: null } }] }, _count: { id: true } }),
    prisma.enrollment.count({ where: { AND: [{ userId: "__report_scope_check__" }, where] } }),
  ])
  const activityTotal = activity.reduce((sum, point) => sum + point.value, 0)
  if (activityTotal !== enrollmentCount || learnerScope !== 0) throw new Error("Reporting count reconciliation failed")
  console.log(JSON.stringify({ enrollmentCount, activityTotal, courseGroups: courseGroups.length, assessmentGroups: attempts.length, eligibleAttempts: eligible._count.id, emptyLearnerScope: learnerScope }))
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Reporting check failed"); process.exitCode = 1 }).finally(() => prisma.$disconnect())
