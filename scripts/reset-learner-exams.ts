import { prisma } from "../lib/prisma"

async function resetExams() {
  console.log("Starting learner exam reset...")

  const txResult = await prisma.$transaction(async (tx) => {
    // 1. Delete all WebRTC signals
    const signals = await tx.webRtcSignal.deleteMany({})

    // 2. Delete all ProctoringEvents
    const events = await tx.proctoringEvent.deleteMany({})

    // 3. Delete all ExamChats
    const chats = await tx.examChat.deleteMany({})

    // 4. Delete all Answers
    const answers = await tx.answer.deleteMany({})

    // 5. Delete all ExamSessions
    const sessions = await tx.examSession.deleteMany({})

    // 6. Delete all AssessmentResults
    const results = await tx.assessmentResult.deleteMany({})

    // 7. Delete test certificates so they can be re-earned
    const certs = await tx.certificate.deleteMany({})

    // 8. Reset enrollments back to ACTIVE status
    const enrollments = await tx.enrollment.updateMany({
      data: {
        status: "ACTIVE",
        completedAt: null,
      },
    })

    // 9. Unlock assessments by clearing bankLockedAt
    const unlocked = await tx.assessment.updateMany({
      where: { bankLockedAt: { not: null } },
      data: { bankLockedAt: null },
    })

    return {
      signalsDeleted: signals.count,
      eventsDeleted: events.count,
      chatsDeleted: chats.count,
      answersDeleted: answers.count,
      sessionsDeleted: sessions.count,
      resultsDeleted: results.count,
      certificatesDeleted: certs.count,
      enrollmentsResetToActive: enrollments.count,
      unlockedAssessments: unlocked.count,
    }
  })

  console.log("Reset completed successfully:")
  console.log(JSON.stringify(txResult, null, 2))
}

resetExams()
  .catch((err) => {
    console.error("Failed to reset exams:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
