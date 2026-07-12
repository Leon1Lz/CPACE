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
