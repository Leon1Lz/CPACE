import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
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

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const courseId = req.nextUrl.searchParams.get("courseId")
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 })

    const { completedModules, progress } = await req.json()

    const updated = await prisma.enrollment.updateMany({
      where: { userId: user.id, courseId },
      data: {
        completedModules: completedModules ?? undefined,
        progress: progress ?? undefined,
        status: progress >= 100 ? "COMPLETED" : "ACTIVE",
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 })
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden - self-enrollment disabled" }, { status: 403 })
    }

    const { userId, courseId } = await request.json()
    if (!userId || !courseId) return NextResponse.json({ error: "userId and courseId are required" }, { status: 400 })

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

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { courseId } = await request.json()
    await prisma.enrollment.deleteMany({ where: { userId: user.id, courseId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to unenroll" }, { status: 500 })
  }
}
