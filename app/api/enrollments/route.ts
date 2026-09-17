import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { canManageCourse } from "@/lib/authorization"
import { prisma } from "@/lib/prisma"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { z } from "zod"
import { calculateModuleProgress } from "@/lib/learning-path-progress"

const progressUpdateSchema = z.object({
  completedModules: z.array(z.string().min(1).max(100)).max(2000),
  progress: z.number().min(0).max(100).optional(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const courseId = req.nextUrl.searchParams.get("courseId")

    if (courseId) {
      // Return the single enrollment for this course
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: user.id, courseId },
        select: { id: true, status: true, progress: true, completedModules: true },
      })
      if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 404 })
      return NextResponse.json(enrollment)
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { id: true, title: true, category: true, level: true, thumbnail: true, description: true, _count: { select: { modules: true, assessments: true } } },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })
    return NextResponse.json(enrollments)
  } catch {
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const courseId = req.nextUrl.searchParams.get("courseId")
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 })

    if (user.role !== "LEARNER") return NextResponse.json({ error: "Learner enrollment required" }, { status: 403 })
    const { completedModules } = progressUpdateSchema.parse(await req.json())
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { status: true, completedModules: true, completedAt: true, course: { select: { status: true } } },
    })
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 404 })
    if (!["ACTIVE", "COMPLETED"].includes(enrollment.status) || enrollment.course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Course enrollment is not available" }, { status: 403 })
    }
    const blocker = await getLearningPathBlocker(user.id, { courseId })
    if (blocker) return NextResponse.json(blocker, { status: 403 })
    const modules = await prisma.courseModule.findMany({ where: { courseId, isPublished: true }, select: { id: true } })
    const validModuleIds = new Set(modules.map(module => module.id))
    if (!modules.length || completedModules.some(moduleId => !validModuleIds.has(moduleId))) {
      return NextResponse.json({ error: "Only published modules from this course can be completed" }, { status: 400 })
    }
    const verifiedModules = Array.from(new Set([...enrollment.completedModules, ...completedModules])).filter(moduleId => validModuleIds.has(moduleId))
    const progress = enrollment.status === "COMPLETED" ? 100 : calculateModuleProgress(verifiedModules.length, modules.length)
    const nextStatus = progress >= 100 ? "COMPLETED" : "ACTIVE"

    const updated = await prisma.enrollment.updateMany({
      where: { userId: user.id, courseId },
      data: {
        completedModules: verifiedModules,
        progress,
        status: nextStatus,
        completedAt: nextStatus === "COMPLETED" ? enrollment.completedAt || new Date() : null,
      },
    })
    return NextResponse.json({ ...updated, progress, status: nextStatus, completedModules: verifiedModules })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid module completion update" }, { status: 400 })
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden - self-enrollment disabled" }, { status: 403 })
    }

    const { userId, courseId } = await request.json()
    if (!userId || !courseId) return NextResponse.json({ error: "userId and courseId are required" }, { status: 400 })
    if (!(await canManageCourse(admin, courseId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Check course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (course.status !== "PUBLISHED") return NextResponse.json({ error: "Course is not available for enrollment" }, { status: 400 })

    // Fetch student profile info for the email
    const student = await prisma.user.findUnique({ where: { id: userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    // Prevent duplicate enrollment
    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })
    if (existing) return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
      include: { course: { select: { id: true, title: true, category: true } } },
    })

    // Trigger welcome email
    const { sendWelcomeEnrollmentEmail } = await import("@/lib/email")
    await sendWelcomeEnrollmentEmail({
      email: student.email,
      studentName: `${student.firstName} ${student.lastName}`,
      courseTitle: course.title,
    })

    // Create DB notification
    const { createNotification } = await import("@/lib/notifications")
    await createNotification({
      userId,
      title: "New Course Enrollment 📚",
      message: `You have been enrolled in "${course.title}".`,
      type: "COURSE",
      link: `/dashboard/courses/${courseId}`,
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (e) {
    console.error("[POST /api/enrollments]", e)
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { courseId } = await request.json()
    await prisma.enrollment.deleteMany({ where: { userId: user.id, courseId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to unenroll" }, { status: 500 })
  }
}
