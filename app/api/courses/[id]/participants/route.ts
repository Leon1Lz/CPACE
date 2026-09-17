import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageCourse } from "@/lib/authorization"

// GET — all enrolled participants for a course with scores & progress
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: courseId } = await params
    if (!(await canManageCourse(user, courseId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: { enrolledAt: "asc" },
    })

    // Get all assessments for this course
    const assessments = await prisma.assessment.findMany({
      where: { courseId },
      select: { id: true, title: true, type: true, passingScore: true },
    })
    const assessmentIds = assessments.map(a => a.id)

    // Get best results per user per assessment
    const results = assessmentIds.length > 0
      ? await prisma.assessmentResult.findMany({
          where: { assessmentId: { in: assessmentIds } },
          orderBy: { createdAt: "desc" },
        })
      : []

    // Get certificates
    const certificates = await prisma.certificate.findMany({
      where: { courseId },
      select: { userId: true, certificateNumber: true, issuedAt: true, isValid: true },
    })

    const certMap = Object.fromEntries(certificates.map(c => [c.userId, c]))

    // Build per-user result map (best score per assessment)
    const resultMap: Record<string, Record<string, { score: number; passed: boolean; attempts: number }>> = {}
    for (const r of results) {
      if (!resultMap[r.userId]) resultMap[r.userId] = {}
      const existing = resultMap[r.userId][r.assessmentId]
      if (!existing || r.score > existing.score) {
        resultMap[r.userId][r.assessmentId] = { score: r.score, passed: r.passed, attempts: 0 }
      }
    }
    // Count attempts
    const attemptCounts = await prisma.assessmentResult.groupBy({
      by: ["userId", "assessmentId"],
      _count: { id: true },
      where: { assessmentId: { in: assessmentIds } },
    })
    for (const ac of attemptCounts) {
      if (resultMap[ac.userId]?.[ac.assessmentId]) {
        resultMap[ac.userId][ac.assessmentId].attempts = ac._count.id
      }
    }

    const participants = enrollments.map(e => ({
      userId: e.userId,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      email: e.user.email,
      enrolledAt: e.enrolledAt,
      progress: e.progress,
      status: e.status,
      certificate: certMap[e.userId] ?? null,
      assessmentResults: assessments.map(a => ({
        assessmentId: a.id,
        title: a.title,
        type: a.type,
        passingScore: a.passingScore,
        ...(resultMap[e.userId]?.[a.id] ?? { score: null, passed: false, attempts: 0 }),
      })),
    }))

    return NextResponse.json({ participants, assessments })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}
