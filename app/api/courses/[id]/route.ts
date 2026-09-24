import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeHtml } from "@/lib/sanitize"
import { canManageOwnedResource } from "@/lib/authorization"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { assertNoAssessmentAttempts, AssessmentIntegrityError } from "@/lib/assessment-integrity"
import { z } from "zod"

const courseUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  content: z.string().max(100000).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  level: z.string().trim().min(1).max(50).optional(),
  duration: z.string().trim().min(1).max(100).optional(),
  price: z.number().min(0).max(999999).optional(),
  thumbnail: z.string().max(2000).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  learningObjectives: z.array(z.string().max(500)).max(50).optional(),
}).strict()

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const isStaff = user?.role === "ADMIN" || user?.role === "INSTRUCTOR"

    const { id } = await params
    const includeModules = req.nextUrl.searchParams.get("modules") === "true"

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { enrollments: true, modules: true, assessments: true } },
        ...(includeModules ? {
          modules: {
            where: isStaff ? {} : { isPublished: true },
            orderBy: { order: "asc" },
            select: { id: true, title: true, description: true, content: true, videoUrl: true, order: true, duration: true },
          },
          assessments: {
            where: isStaff ? {} : { isPublished: true },
            orderBy: { createdAt: "desc" },
            include: {
              _count: { select: { questions: true } }
            }
          }
        } : {}),
      },
    })
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const staffAccess = !!user && canManageOwnedResource(user, course.instructor?.id)
    let learnerAccess = false
    if (user?.role === "LEARNER" && course.status === "PUBLISHED") {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: id } },
        select: { id: true, status: true },
      })
      learnerAccess = !!enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED")
    }
    if (!staffAccess && !learnerAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (user?.role === "LEARNER") {
      const blocker = await getLearningPathBlocker(user.id, { courseId: id })
      if (blocker) return NextResponse.json(blocker, { status: 403 })
    }
    return NextResponse.json(course)
  } catch {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const target = await prisma.course.findUnique({ where: { id }, select: { instructorId: true } })
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!canManageOwnedResource(user, target.instructorId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const rawData = courseUpdateSchema.parse(await request.json())

    const updateData: Record<string, unknown> = { ...rawData }
    // Sanitize HTML content field before saving
    if (rawData.content) {
      updateData.content = sanitizeHtml(rawData.content)
    }

    const updated = await prisma.course.update({ where: { id }, data: updateData })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid course data" }, { status: 400 })
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    await prisma.$transaction(async tx => {
      const courses = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "courses" WHERE "id" = ${id} FOR UPDATE`
      if (!courses.length) throw new AssessmentIntegrityError("Course not found", 404)
      const assessments = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "assessments" WHERE "courseId" = ${id} ORDER BY "id" FOR UPDATE`
      for (const assessment of assessments) await assertNoAssessmentAttempts(tx, assessment.id)
      await tx.course.delete({ where: { id } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
