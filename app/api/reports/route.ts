import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { createCSV, dailyActivity, MAX_EXPORT_ROWS, parseReportRange, percentage, reportDay, REPORT_TIME_ZONE, type ReportSummary } from "@/lib/reporting"

function csvResponse(type: string, rows: unknown[][], headers: string[]) {
  if (rows.length > MAX_EXPORT_ROWS) return NextResponse.json({ error: "Export exceeds 10,000 rows. Choose a smaller date range." }, { status: 413 })
  return new NextResponse(createCSV(headers, rows), { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cpace-${type}.csv"`, "Cache-Control": "no-store",
  } })
}
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerSession(authOptions)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { id: true, role: true } })
    if (!user || !["ADMIN", "INSTRUCTOR", "LEARNER"].includes(user.role)) return NextResponse.json({ error: "Reports are available to admins, instructors, and learners. Proctors use Exam Monitor." }, { status: 403 })
    let range
    try { range = parseReportRange(request.nextUrl.searchParams) }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid date range" }, { status: 400 }) }
    const exportType = request.nextUrl.searchParams.get("export")
    if (exportType && !["users", "enrollments", "results"].includes(exportType)) return NextResponse.json({ error: "Unknown export type" }, { status: 400 })
    if (exportType && (user.role === "LEARNER" || (exportType === "users" && user.role !== "ADMIN"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const dateFilter = { gte: range.from, lt: range.until }
    if (exportType === "users") {
      const users = await prisma.user.findMany({ where: { createdAt: dateFilter }, take: MAX_EXPORT_ROWS + 1, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true } })
      return csvResponse("users", users.map(row => [row.id, row.email, row.firstName, row.lastName, row.role, row.isActive, row.createdAt]), ["ID", "Email", "First name", "Last name", "Role", "Active", "Created at (UTC)"])
    }
    const enrollmentScope: Prisma.EnrollmentWhereInput = user.role === "INSTRUCTOR" ? { course: { instructorId: user.id } } : user.role === "LEARNER" ? { userId: user.id } : {}
    const resultScope: Prisma.AssessmentResultWhereInput = user.role === "INSTRUCTOR" ? { assessment: { course: { instructorId: user.id } } } : user.role === "LEARNER" ? { userId: user.id } : {}
    if (exportType === "enrollments") {
      const rows = await prisma.enrollment.findMany({ where: { AND: [enrollmentScope, { enrolledAt: dateFilter }] }, take: MAX_EXPORT_ROWS + 1,
        orderBy: [{ enrolledAt: "desc" }, { id: "desc" }], select: { progress: true, status: true, enrolledAt: true, completedAt: true, user: { select: { email: true, firstName: true, lastName: true } }, course: { select: { title: true, category: true } } } })
      return csvResponse("enrollments", rows.map(row => [row.user.email, `${row.user.firstName} ${row.user.lastName}`, row.course.title, row.course.category, row.progress, row.status, row.enrolledAt, row.completedAt]), ["Email", "Learner", "Course", "Category", "Progress %", "Status", "Enrolled at (UTC)", "Completed at (UTC)"])
    }
    if (exportType === "results") {
      const rows = await prisma.assessmentResult.findMany({ where: { AND: [resultScope, { completedAt: dateFilter }] }, take: MAX_EXPORT_ROWS + 1,
        orderBy: [{ completedAt: "desc" }, { id: "desc" }], select: { score: true, passed: true, attempt: true, completedAt: true, gradedAt: true, user: { select: { email: true, firstName: true, lastName: true } }, assessment: { select: { title: true, course: { select: { title: true } }, questions: { select: { type: true } } } } } })
      return csvResponse("results", rows.map(row => [row.user.email, `${row.user.firstName} ${row.user.lastName}`, row.assessment.title, row.assessment.course.title, row.gradedAt ? row.score : null, row.gradedAt ? row.passed : null, row.attempt, row.completedAt, row.gradedAt ? "Graded" : "Awaiting manual grading"]), ["Email", "Learner", "Assessment", "Course", "Score %", "Passed", "Attempt", "Completed at (UTC)", "Grading status"])
    }
    const now = new Date()
    const releasedScope: Prisma.AssessmentResultWhereInput = user.role === "LEARNER" ? { assessment: { OR: [{ releaseScores: true }, { scoresReleasedAt: { lte: now } }] } } : {}
    const gradedScope: Prisma.AssessmentResultWhereInput = { gradedAt: { not: null } }
    const resultWhere: Prisma.AssessmentResultWhereInput = { AND: [resultScope, { completedAt: dateFilter }] }
    const gradedWhere: Prisma.AssessmentResultWhereInput = { AND: [resultWhere, releasedScope, gradedScope] }
    const enrollmentWhere: Prisma.EnrollmentWhereInput = { AND: [enrollmentScope, { enrolledAt: dateFilter }] }
    const courseWhere: Prisma.CourseWhereInput = user.role === "INSTRUCTOR" ? { instructorId: user.id } : user.role === "LEARNER" ? { enrollments: { some: { userId: user.id } } } : {}
    const [enrollmentCounts, enrollmentDates, attemptCounts, gradedCounts, passedCounts, gradedAggregate, recentResults, courses, manualReviewSubmissions] = await Promise.all([
      prisma.enrollment.groupBy({ by: ["courseId", "status"], where: enrollmentWhere, _count: { id: true } }),
      prisma.enrollment.groupBy({ by: ["enrolledAt"], where: enrollmentWhere, _count: { id: true } }),
      prisma.assessmentResult.groupBy({ by: ["assessmentId"], where: resultWhere, _count: { id: true } }),
      prisma.assessmentResult.groupBy({ by: ["assessmentId"], where: gradedWhere, _count: { id: true } }),
      prisma.assessmentResult.groupBy({ by: ["assessmentId"], where: { AND: [gradedWhere, { passed: true }] }, _count: { id: true } }),
      prisma.assessmentResult.aggregate({ where: gradedWhere, _avg: { score: true } }),
      prisma.assessmentResult.findMany({ where: resultWhere, take: 20, orderBy: [{ completedAt: "desc" }, { id: "desc" }], select: { id: true, score: true, passed: true, completedAt: true, gradedAt: true, answers: { where: { question: { type: { in: ["SHORT_ANSWER", "ESSAY"] } } }, select: { points: true, feedback: true, question: { select: { question: true, points: true } } } }, assessment: { select: { title: true, releaseScores: true, scoresReleasedAt: true, questions: { select: { type: true } }, course: { select: { title: true } } } } } }),
      prisma.course.findMany({ where: courseWhere, orderBy: { title: "asc" }, select: { id: true, title: true, assessments: { select: { id: true } } } }),
      prisma.assessmentResult.count({ where: { AND: [resultWhere, { gradedAt: null, assessment: { questions: { some: { type: { in: ["SHORT_ANSWER", "ESSAY"] } } } } }] } }),
    ])
    const count = (rows: { _count: { id: number } }[]) => rows.reduce((sum, row) => sum + row._count.id, 0)
    const totalEnrollments = count(enrollmentCounts), completed = count(enrollmentCounts.filter(row => row.status === "COMPLETED"))
    const attempts = count(attemptCounts), gradedAttempts = count(gradedCounts), passed = count(passedCounts)
    const activity = dailyActivity([], range)
    const activityByDate = new Map(activity.map(point => [point.date, point]))
    for (const row of enrollmentDates) {
      const target = activityByDate.get(reportDay(row.enrolledAt))
      if (target) target.value += row._count.id
    }
    const payload: ReportSummary = {
      role: user.role as ReportSummary["role"], range: { start: range.start, end: range.end, timeZone: REPORT_TIME_ZONE },
      summary: { enrollments: totalEnrollments, completed, completionRate: percentage(completed, totalEnrollments), attempts, gradedAttempts, passed, passRate: percentage(passed, gradedAttempts), averageScore: gradedAggregate._avg.score, manualReviewSubmissions },
      activity,
      courses: courses.map(course => {
        const ids = new Set(course.assessments.map(a => a.id))
        const enrolled = count(enrollmentCounts.filter(row => row.courseId === course.id)), done = count(enrollmentCounts.filter(row => row.courseId === course.id && row.status === "COMPLETED"))
        const total = count(attemptCounts.filter(row => ids.has(row.assessmentId))), graded = count(gradedCounts.filter(row => ids.has(row.assessmentId))), successes = count(passedCounts.filter(row => ids.has(row.assessmentId)))
        return { id: course.id, title: course.title, enrollments: enrolled, completed: done, completionRate: percentage(done, enrolled), attempts: total, gradedAttempts: graded, passRate: percentage(successes, graded) }
      }),
      results: recentResults.map(result => {
        const scoresReleased = result.assessment.releaseScores || Boolean(result.assessment.scoresReleasedAt && result.assessment.scoresReleasedAt <= now)
        const manualReview = !result.gradedAt && result.assessment.questions.some(q => ["SHORT_ANSWER", "ESSAY"].includes(q.type))
        const canSeeScore = !manualReview && (user.role !== "LEARNER" || scoresReleased)
        return { id: result.id, title: result.assessment.title, courseTitle: result.assessment.course.title, completedAt: result.completedAt!.toISOString(), score: canSeeScore ? result.score : null, passed: canSeeScore ? result.passed : null, scoresReleased, manualReview, feedback: canSeeScore ? (result.answers ?? []).map(answer => ({ question: answer.question.question, points: answer.points, maximum: answer.question.points, feedback: answer.feedback })) : [] }
      }),
    }
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Reports failed:", error instanceof Error ? error.name : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
