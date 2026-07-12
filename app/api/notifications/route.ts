import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const notifications: { id: string; type: string; title: string; message: string; href: string; at: string }[] = []

    if (user.role === "LEARNER") {
      // New certificates
      const certs = await prisma.certificate.findMany({
        where: { userId: user.id },
        orderBy: { issuedAt: "desc" },
        take: 5,
        include: { course: { select: { title: true } } },
      })
      certs.forEach(c => {
        notifications.push({
          id: `cert-${c.id}`,
          type: "certificate",
          title: "Certificate Issued 🎓",
          message: `You earned a certificate for "${c.course.title}"`,
          href: "/dashboard/certificates",
          at: c.issuedAt.toISOString(),
        })
      })

      // Assessment results
      const results = await prisma.assessmentResult.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
        take: 5,
        include: { assessment: { select: { title: true } } },
      })
      results.forEach(r => {
        if (!r.completedAt) return
        notifications.push({
          id: `result-${r.id}`,
          type: r.passed ? "pass" : "fail",
          title: r.passed ? "Assessment Passed ✅" : "Assessment Not Passed ❌",
          message: `${r.assessment.title} — Score: ${r.score?.toFixed(0)}%`,
          href: "/dashboard/assessments",
          at: r.completedAt.toISOString(),
        })
      })
    }

    if (user.role === "ADMIN" || user.role === "INSTRUCTOR") {
      // Recent enrollments
      const whereClause = user.role === "INSTRUCTOR"
        ? { course: { instructorId: user.id } }
        : {}
      const enrollments = await prisma.enrollment.findMany({
        where: whereClause,
        orderBy: { enrolledAt: "desc" },
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true } },
          course: { select: { title: true } },
        },
      })
      enrollments.forEach(e => {
        notifications.push({
          id: `enroll-${e.id}`,
          type: "enrollment",
          title: "New Enrollment 📚",
          message: `${e.user.firstName} ${e.user.lastName} enrolled in "${e.course.title}"`,
          href: "/dashboard/reports",
          at: e.enrolledAt.toISOString(),
        })
      })
    }

    if (user.role === "PROCTOR" || user.role === "ADMIN") {
      // Flagged sessions
      const flagged = await prisma.examSession.findMany({
        where: { flagged: true },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          user: { select: { firstName: true, lastName: true } },
          assessment: { select: { title: true } },
        },
      })
      flagged.forEach(s => {
        notifications.push({
          id: `flag-${s.id}`,
          type: "flag",
          title: "Session Flagged 🚩",
          message: `${s.user.firstName} ${s.user.lastName} — ${s.assessment.title}`,
          href: "/dashboard/proctor",
          at: s.startedAt.toISOString(),
        })
      })
    }

    // Sort all by date desc
    notifications.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

    return NextResponse.json(notifications.slice(0, 10))
  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
