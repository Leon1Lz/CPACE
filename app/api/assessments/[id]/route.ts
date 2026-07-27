import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: { orderBy: { order: "asc" } },
          },
        },
        _count: { select: { results: true, questions: true } },
      },
    })

    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(assessment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const rawData = await request.json()

    // Fetch existing state
    const existing = await prisma.assessment.findUnique({
      where: { id },
      include: { course: true }
    })
    if (!existing) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })

    const wasReleased = existing.releaseScores !== false || (existing.scoresReleasedAt && new Date() >= new Date(existing.scoresReleasedAt))

    // Perform database update
    const updated = await prisma.assessment.update({ where: { id }, data: rawData })

    const isReleasedNow = updated.releaseScores !== false || (updated.scoresReleasedAt && new Date() >= new Date(updated.scoresReleasedAt))

    // Transition triggered: Release scores and generate certificates/notifications
    if (!wasReleased && isReleasedNow) {
      const passedResults = await prisma.assessmentResult.findMany({
        where: { assessmentId: id, passed: true },
        include: { user: true },
      })

      const { createNotification } = await import("@/lib/notifications")

      for (const res of passedResults) {
        // Send exam result notification
        await createNotification({
          userId: res.userId,
          title: "Exam Results Released 📢",
          message: `Your score of ${res.score.toFixed(0)}% for "${updated.title}" is now available.`,
          type: "SUCCESS",
          link: "/dashboard/assessments",
        })

        // Auto-issue certificate if final exam
        if (updated.type === "FINAL_EXAM") {
          const certExists = await prisma.certificate.findFirst({
            where: { userId: res.userId, courseId: updated.courseId },
          })
          if (!certExists) {
            const certNumber = `CPACE-${Date.now()}-${res.userId.slice(-4).toUpperCase()}`
            await prisma.certificate.create({
              data: {
                title: `Certificate of Completion — ${existing.course.title}`,
                description: `Successfully completed the final examination for ${existing.course.title}`,
                certificateNumber: certNumber,
                userId: res.userId,
                courseId: updated.courseId,
              },
            })

            await createNotification({
              userId: res.userId,
              title: "Certificate Issued 🎓",
              message: `Congratulations! You earned a certificate for "${existing.course.title}".`,
              type: "SUCCESS",
              link: "/dashboard/certificates",
            })

            await prisma.enrollment.updateMany({
              where: { userId: res.userId, courseId: updated.courseId },
              data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
            })
          }
        }
      }

      // Notify non-passing learners as well
      const failedResults = await prisma.assessmentResult.findMany({
        where: { assessmentId: id, passed: false },
      })
      for (const res of failedResults) {
        await createNotification({
          userId: res.userId,
          title: "Exam Results Released 📢",
          message: `Your results for "${updated.title}" have been released (Score: ${res.score.toFixed(0)}%).`,
          type: "INFO",
          link: "/dashboard/assessments",
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update assessment error:", error)
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    await prisma.assessment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete assessment error:", error)
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 })
  }
}

