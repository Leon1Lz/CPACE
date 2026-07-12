import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper: count records created this week vs last week
async function weekTrend(
  model: any,
  whereBase: object = {}
): Promise<{ current: number; previous: number; pct: number | null }> {
  const now = new Date()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - 7)
  startOfThisWeek.setHours(0, 0, 0, 0)

  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

  const [current, previous] = await Promise.all([
    model.count({ where: { ...whereBase, createdAt: { gte: startOfThisWeek } } }),
    model.count({ where: { ...whereBase, createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } }),
  ])

  const pct = previous === 0 ? (current > 0 ? 100 : null) : Math.round(((current - previous) / previous) * 100)
  return { current, previous, pct }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userRecord = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const role = userRecord.role

    if (role === "ADMIN") {
      const [
        totalUsers, totalCourses, totalEnrollments, totalCertificates,
        recentEnrollments,
        userTrend, courseTrend, enrollmentTrend, certTrend,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.certificate.count(),
        prisma.enrollment.findMany({
          take: 5,
          orderBy: { enrolledAt: "desc" },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { title: true, category: true } },
          },
        }),
        weekTrend(prisma.user),
        weekTrend(prisma.course),
        weekTrend(prisma.enrollment),
        weekTrend(prisma.certificate),
      ])
      return NextResponse.json({
        role, totalUsers, totalCourses, totalEnrollments, totalCertificates, recentEnrollments,
        trends: {
          users: userTrend,
          courses: courseTrend,
          enrollments: enrollmentTrend,
          certificates: certTrend,
        },
      })
    }

    if (role === "INSTRUCTOR") {
      const [myCourses, recentSubmissions] = await Promise.all([
        prisma.course.findMany({
          where: { instructorId: userRecord.id },
          include: { _count: { select: { enrollments: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.assessmentResult.findMany({
          take: 5,
          where: { assessment: { course: { instructorId: userRecord.id } } },
          orderBy: { startedAt: "desc" },
          include: {
            user: { select: { firstName: true, lastName: true } },
            assessment: { select: { title: true, course: { select: { title: true } } } },
          },
        }),
      ])
      const totalLearners = myCourses.reduce((sum, c) => sum + c._count.enrollments, 0)
      const pendingGrading = recentSubmissions.filter(r => !r.completedAt).length

      // Trend: new learners enrolled in instructor's courses this week vs last
      const now = new Date()
      const startOfThisWeek = new Date(now); startOfThisWeek.setDate(now.getDate() - 7); startOfThisWeek.setHours(0,0,0,0)
      const startOfLastWeek = new Date(startOfThisWeek); startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)
      const courseIds = myCourses.map(c => c.id)

      const [learnersThisWeek, learnersLastWeek] = await Promise.all([
        prisma.enrollment.count({ where: { courseId: { in: courseIds }, enrolledAt: { gte: startOfThisWeek } } }),
        prisma.enrollment.count({ where: { courseId: { in: courseIds }, enrolledAt: { gte: startOfLastWeek, lt: startOfThisWeek } } }),
      ])
      const learnerPct = learnersLastWeek === 0 ? (learnersThisWeek > 0 ? 100 : null) : Math.round(((learnersThisWeek - learnersLastWeek) / learnersLastWeek) * 100)

      return NextResponse.json({
        role, myCourses, recentSubmissions, totalLearners, pendingGrading,
        trends: {
          learners: { current: learnersThisWeek, previous: learnersLastWeek, pct: learnerPct },
          submissions: { current: recentSubmissions.length, previous: null, pct: null },
        },
      })
    }

    // PROCTOR
    if (role === "PROCTOR") {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

      const [activeSessions, todaySessions, flaggedSessions, yesterdaySessions] = await Promise.all([
        prisma.examSession.count({ where: { status: "IN_PROGRESS" } }),
        prisma.examSession.count({ where: { startedAt: { gte: today } } }),
        prisma.examSession.count({ where: { flagged: true } }),
        prisma.examSession.count({ where: { startedAt: { gte: yesterday, lt: today } } }),
      ])
      const sessionPct = yesterdaySessions === 0 ? (todaySessions > 0 ? 100 : null) : Math.round(((todaySessions - yesterdaySessions) / yesterdaySessions) * 100)

      return NextResponse.json({
        role, activeSessions, todaySessions, flaggedSessions,
        trends: { sessions: { current: todaySessions, previous: yesterdaySessions, pct: sessionPct } },
      })
    }

    // LEARNER
    const [enrollments, certificates, upcomingAssessments] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: userRecord.id },
        include: {
          course: {
            select: {
              id: true, title: true, category: true, thumbnail: true,
              _count: { select: { modules: true } },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      }),
      prisma.certificate.findMany({
        where: { userId: userRecord.id },
        include: { course: { select: { title: true } } },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.assessment.findMany({
        where: {
          isPublished: true,
          course: { enrollments: { some: { userId: userRecord.id } } },
        },
        include: { course: { select: { title: true } } },
        take: 5,
      }),
    ])

    const completed = enrollments.filter(e => e.status === "COMPLETED").length
    const inProgress = enrollments.filter(e => e.status === "ACTIVE").length

    return NextResponse.json({
      role, enrollments, certificates, upcomingAssessments,
      trends: {
        completed: { current: completed, previous: null, pct: null },
        inProgress: { current: inProgress, previous: null, pct: null },
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
