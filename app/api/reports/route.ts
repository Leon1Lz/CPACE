import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper to escape CSV cells
function escapeCSV(val: any): string {
  if (val == null) return ""
  if (val instanceof Date) return val.toISOString()
  const str = "" + val
  return `"${str.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const exportType = searchParams.get("export")

    if (exportType) {
      if (exportType === "users") {
        if (user.role !== "ADMIN") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const data = await prisma.user.findMany({
          orderBy: { createdAt: "desc" }
        })
        const headers = ["ID", "Email", "First Name", "Last Name", "Role", "Active", "Created At"]
        const rows = data.map(u => [
          u.id,
          u.email,
          u.firstName,
          u.lastName,
          u.role,
          u.isActive ? "Yes" : "No",
          u.createdAt
        ])
        const csvContent = [headers.join(","), ...rows.map(r => r.map(escapeCSV).join(","))].join("\n")
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="cpace-users-export.csv"'
          }
        })
      }

      if (exportType === "enrollments") {
        if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const whereClause = user.role === "INSTRUCTOR" ? { course: { instructorId: user.id } } : {}
        const data = await prisma.enrollment.findMany({
          where: whereClause,
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { title: true, category: true } }
          },
          orderBy: { enrolledAt: "desc" }
        })
        const headers = ["User Email", "User Name", "Course Title", "Course Category", "Progress %", "Status", "Enrolled At"]
        const rows = data.map(e => [
          e.user.email,
          `${e.user.firstName} ${e.user.lastName}`,
          e.course.title,
          e.course.category ?? "General",
          e.progress,
          e.status,
          e.enrolledAt
        ])
        const csvContent = [headers.join(","), ...rows.map(r => r.map(escapeCSV).join(","))].join("\n")
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="cpace-enrollments-export.csv"'
          }
        })
      }

      if (exportType === "results") {
        if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const whereClause = user.role === "INSTRUCTOR" ? { assessment: { course: { instructorId: user.id } } } : {}
        const data = await prisma.assessmentResult.findMany({
          where: whereClause,
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            assessment: { select: { title: true, type: true, course: { select: { title: true } } } }
          },
          orderBy: { startedAt: "desc" }
        })
        const headers = ["User Email", "User Name", "Assessment Title", "Assessment Type", "Course Title", "Score %", "Passed", "Attempt", "Started At", "Completed At"]
        const rows = data.map(r => [
          r.user.email,
          `${r.user.firstName} ${r.user.lastName}`,
          r.assessment.title,
          r.assessment.type,
          r.assessment.course.title,
          r.score?.toFixed(1) ?? "0",
          r.passed ? "Yes" : "No",
          r.attempt,
          r.startedAt,
          r.completedAt
        ])
        const csvContent = [headers.join(","), ...rows.map(r => r.map(escapeCSV).join(","))].join("\n")
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="cpace-exam-results.csv"'
          }
        })
      }
    }

    if (user.role === "ADMIN") {
      const [usersByRole, enrollmentsByStatus, assessmentResults, topCourses] = await Promise.all([
        prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
        prisma.enrollment.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.assessmentResult.aggregate({ _avg: { score: true }, _count: { id: true } }),
        prisma.course.findMany({
          take: 5,
          orderBy: { enrollments: { _count: "desc" } },
          select: { id: true, title: true, category: true, _count: { select: { enrollments: true } } },
        }),
      ])
      return NextResponse.json({ usersByRole, enrollmentsByStatus, assessmentResults, topCourses })
    }

    if (user.role === "INSTRUCTOR") {
      const courses = await prisma.course.findMany({
        where: { instructorId: user.id },
        include: {
          _count: { select: { enrollments: true, assessments: true } },
          enrollments: { select: { status: true, progress: true } },
        },
      })
      return NextResponse.json({ courses })
    }

    // LEARNER
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: { select: { title: true, category: true } },
      },
    })
    const results = await prisma.assessmentResult.findMany({
      where: { userId: user.id },
      include: { assessment: { select: { title: true, course: { select: { title: true } } } } },
      orderBy: { startedAt: "desc" },
    })
    return NextResponse.json({ enrollments, results })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
