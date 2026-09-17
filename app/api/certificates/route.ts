import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""

    // Auto-release/auto-issuance check for learners
    if (user.role === "LEARNER") {
      const pendingCerts = await prisma.assessmentResult.findMany({
        where: {
          userId: user.id,
          passed: true,
          assessment: {
            type: "FINAL_EXAM",
            OR: [
              { releaseScores: true },
              { scoresReleasedAt: { lte: new Date() } },
            ]
          }
        },
        include: { assessment: { include: { course: true } } }
      })

      if (pendingCerts.length > 0) {
        const { createNotification } = await import("@/lib/notifications")
        for (const res of pendingCerts) {
          const certExists = await prisma.certificate.findFirst({
            where: { userId: user.id, courseId: res.assessment.courseId },
          })
          if (!certExists) {
            const certNumber = `CPACE-${Date.now()}-${user.id.slice(-4).toUpperCase()}`
            await prisma.certificate.create({
              data: {
                title: `Certificate of Completion — ${res.assessment.course.title}`,
                description: `Successfully completed the final examination for ${res.assessment.course.title}`,
                certificateNumber: certNumber,
                userId: user.id,
                courseId: res.assessment.courseId,
              },
            })

            await createNotification({
              userId: user.id,
              title: "Certificate Issued 🎓",
              message: `Congratulations! You earned a certificate for "${res.assessment.course.title}".`,
              type: "SUCCESS",
              link: "/dashboard/certificates",
            })

            await prisma.enrollment.updateMany({
              where: { userId: user.id, courseId: res.assessment.courseId },
              data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
            })
          }
        }
      }
    }

    const where: any = {}
    if (user.role !== "ADMIN") {
      where.userId = user.id
    }

    if (search) {
      where.AND = [
        ...(user.role !== "ADMIN" ? [{ userId: user.id }] : []),
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { certificateNumber: { contains: search, mode: "insensitive" } },
            { course: { title: { contains: search, mode: "insensitive" } } },
            ...(user.role === "ADMIN" ? [
              { user: { firstName: { contains: search, mode: "insensitive" } } },
              { user: { lastName: { contains: search, mode: "insensitive" } } },
            ] : []),
          ]
        }
      ]
    }

    const include = user.role === "ADMIN"
      ? { user: { select: { firstName: true, lastName: true, email: true } }, course: { select: { title: true, category: true } } }
      : { course: { select: { title: true, category: true } } }

    const [certificates, total, validTotal, uniqueCourses] = await Promise.all([
      prisma.certificate.findMany({ where, include, orderBy: { issuedAt: "desc" }, skip, take: limit }),
      prisma.certificate.count({ where }),
      prisma.certificate.count({ where: { ...where, isValid: true } }),
      prisma.certificate.findMany({ where, select: { courseId: true }, distinct: ['courseId'] }),
    ])

    return NextResponse.json({
      data: certificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total,
        valid: validTotal,
        coursesCount: uniqueCourses.length,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
