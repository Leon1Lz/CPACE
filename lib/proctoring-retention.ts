import { prisma } from "@/lib/prisma"

let lastCleanupAt = 0

export async function pruneExpiredProctoringEvidence(force = false) {
  const now = Date.now()
  if (!force && now - lastCleanupAt < 60 * 60 * 1000) return { cleared: 0, skipped: true }
  lastCleanupAt = now

  const events = await prisma.proctoringEvent.findMany({
    where: { evidenceSnapshot: { not: null } },
    select: {
      id: true,
      createdAt: true,
      session: { select: { assessment: { select: { evidenceRetentionDays: true } } } },
    },
  })

  const expiredIds = events
    .filter((event) => {
      const retentionMs = Math.max(0, event.session.assessment.evidenceRetentionDays) * 24 * 60 * 60 * 1000
      return event.createdAt.getTime() + retentionMs <= now
    })
    .map((event) => event.id)

  const identitySessions = await prisma.examSession.findMany({
    where: { OR: [{ identityPhoto: { not: null } }, { idPhoto: { not: null } }] },
    select: {
      id: true,
      startedAt: true,
      assessment: { select: { evidenceRetentionDays: true } },
    },
  })
  const expiredSessionIds = identitySessions
    .filter((session) => {
      const retentionMs = Math.max(0, session.assessment.evidenceRetentionDays) * 24 * 60 * 60 * 1000
      return session.startedAt.getTime() + retentionMs <= now
    })
    .map((session) => session.id)

  const [eventResult, sessionResult] = await prisma.$transaction([
    prisma.proctoringEvent.updateMany({
      where: { id: { in: expiredIds } },
      data: { evidenceSnapshot: null },
    }),
    prisma.examSession.updateMany({
      where: { id: { in: expiredSessionIds } },
      data: { identityPhoto: null, idPhoto: null },
    }),
  ])
  return { cleared: eventResult.count + sessionResult.count, skipped: false }
}

export async function pruneExpiredProctoringSession(sessionId: string) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: {
      startedAt: true,
      assessment: { select: { evidenceRetentionDays: true } },
    },
  })
  if (!session) return false

  const retentionMs = Math.max(0, session.assessment.evidenceRetentionDays) * 24 * 60 * 60 * 1000
  if (session.startedAt.getTime() + retentionMs > Date.now()) return false

  await prisma.$transaction([
    prisma.examSession.update({
      where: { id: sessionId },
      data: { identityPhoto: null, idPhoto: null },
    }),
    prisma.proctoringEvent.updateMany({
      where: { sessionId },
      data: { evidenceSnapshot: null },
    }),
  ])
  return true
}
