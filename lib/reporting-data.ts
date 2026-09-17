import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { dailyActivity, reportDay, type ReportRange } from "@/lib/reporting"

export async function getEnrollmentActivity(range: ReportRange, scope: Prisma.EnrollmentWhereInput = {}) {
  const dates = await prisma.enrollment.groupBy({ by: ["enrolledAt"], where: { AND: [scope, { enrolledAt: { gte: range.from, lt: range.until } }] }, _count: { id: true } })
  const activity = dailyActivity([], range)
  const byDate = new Map(activity.map(point => [point.date, point]))
  for (const entry of dates) { const point = byDate.get(reportDay(entry.enrolledAt)); if (point) point.value += entry._count.id }
  return activity
}
