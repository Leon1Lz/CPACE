import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { id: assessmentId } = await params
    const { answers, startedAt, sessionId } = await request.json()
    // answers: { questionId: string, selectedOptionId?: string, content?: string }[]

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: { include: { options: true } },
        course: { select: { id: true, title: true } },
      },
    })
    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 })

    // Enforce attempt limits for FINAL_EXAM
    if (assessment.type === "FINAL_EXAM" && assessment.attempts !== null) {
      const attemptCount = await prisma.assessmentResult.count({
        where: { assessmentId, userId: user.id },
      })
      if (attemptCount >= assessment.attempts) {
        return NextResponse.json({ error: "Maximum attempts reached" }, { status: 400 })
      }
    }

    const attemptNumber = await prisma.assessmentResult.count({
      where: { assessmentId, userId: user.id },
    })

    // Score the answers
    let totalPoints = 0
    let earnedPoints = 0
    const scoredAnswers: { questionId: string; content: string; isCorrect: boolean; points: number }[] = []

    for (const question of assessment.questions) {
      totalPoints += question.points
      const userAnswer = answers.find((a: any) => a.questionId === question.id)
      if (!userAnswer) {
        scoredAnswers.push({ questionId: question.id, content: "", isCorrect: false, points: 0 })
        continue
      }

      let isCorrect = false
      let pointsEarned = 0
      let answerContent = userAnswer.content ?? ""

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        const selectedOption = question.options.find((o: any) => o.id === userAnswer.selectedOptionId)
        isCorrect = selectedOption?.isCorrect ?? false
        answerContent = selectedOption?.text ?? ""
        pointsEarned = isCorrect ? question.points : 0
      } else if (question.type === "SHORT_ANSWER" || question.type === "ESSAY") {
        // Open-ended: store the content, mark for manual review (isCorrect = false until reviewed)
        answerContent = userAnswer.content ?? ""
        isCorrect = false
        pointsEarned = 0
      }

      earnedPoints += pointsEarned
      scoredAnswers.push({ questionId: question.id, content: answerContent, isCorrect, points: pointsEarned })
    }

    // Check if any open-ended questions exist (they are manually reviewed)
    const hasOpenEnded = assessment.questions.some(
      q => q.type === "SHORT_ANSWER" || q.type === "ESSAY"
    )
    // For scoring purposes, only auto-scored questions count toward total when open-ended exist
    const autoScoredTotal = assessment.questions
      .filter(q => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE")
      .reduce((sum, q) => sum + q.points, 0)
    const scoreBase = hasOpenEnded ? (autoScoredTotal > 0 ? autoScoredTotal : totalPoints) : totalPoints
    const score = scoreBase > 0 ? (earnedPoints / scoreBase) * 100 : 0
    const passed = !hasOpenEnded && score >= assessment.passingScore

    // Save result + answers
    const result = await prisma.assessmentResult.create({
      data: {
        userId: user.id,
        assessmentId,
        score,
        passed,
        attempt: attemptNumber + 1,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: new Date(),
        answers: {
          create: scoredAnswers,
        },
      },
    })

    // Link and close ExamSession
    if (sessionId) {
      await prisma.examSession.update({
        where: { id: sessionId },
        data: { status: "SUBMITTED", submittedAt: new Date(), resultId: result.id },
      }).catch(() => null) // silent — don't fail the submit if session update fails
    }

    const released = assessment.releaseScores !== false || (assessment.scoresReleasedAt && new Date() >= new Date(assessment.scoresReleasedAt))
    const { createNotification } = await import("@/lib/notifications")
    
    // Create DB notification for assessment completion
    if (released) {
      await createNotification({
        userId: user.id,
        title: passed ? "Assessment Passed ✅" : "Assessment Completed",
        message: `You completed "${assessment.title}" with a score of ${score.toFixed(0)}%.`,
        type: passed ? "SUCCESS" : "INFO",
        link: "/dashboard/assessments",
      })
    } else {
      await createNotification({
        userId: user.id,
        title: "Assessment Submitted 📝",
        message: `You successfully submitted your answers for "${assessment.title}". Results will be released once they are processed.`,
        type: "INFO",
        link: "/dashboard/assessments",
      })
    }

    // Auto-issue certificate if FINAL_EXAM and passed (only when released!)
    let certificate = null
    if (released && assessment.type === "FINAL_EXAM" && passed) {
      const existing = await prisma.certificate.findFirst({
        where: { userId: user.id, courseId: assessment.courseId },
      })
      if (!existing) {
        const certNumber = `CPACE-${Date.now()}-${user.id.slice(-4).toUpperCase()}`
        certificate = await prisma.certificate.create({
          data: {
            title: `Certificate of Completion — ${assessment.course.title}`,
            description: `Successfully completed the final examination for ${assessment.course.title}`,
            certificateNumber: certNumber,
            userId: user.id,
            courseId: assessment.courseId,
          },
        })

        // Create DB notification for certificate
        await createNotification({
          userId: user.id,
          title: "Certificate Issued 🎓",
          message: `Congratulations! You earned a certificate for "${assessment.course.title}".`,
          type: "SUCCESS",
          link: "/dashboard/certificates",
        })

        // Update enrollment to COMPLETED
        await prisma.enrollment.updateMany({
          where: { userId: user.id, courseId: assessment.courseId },
          data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
        })
      }
    }

    return NextResponse.json({
      resultId: result.id,
      score: released ? score : null,
      passed: released ? passed : null,
      totalPoints,
      earnedPoints: released ? earnedPoints : null,
      attempt: attemptNumber + 1,
      certificate: released ? certificate : null,
      hasOpenEnded,
      scoresReleased: released,
    })
  } catch (error) {
    console.error("Submit error:", error)
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 })
  }
}
