import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { AuthorizedUser } from "@/lib/authorization"

export type ProctorScope = { courseId: string; groupId: string | null }

export function buildProctorSessionScope(assignments: ProctorScope[]): Prisma.ExamSessionWhereInput {
  if (!assignments.length) return { id: { in: [] } }
  return { OR: assignments.map(assignment => ({
    assessment: { courseId: assignment.courseId },
    ...(assignment.groupId ? { user: { groupMemberships: { some: { groupId: assignment.groupId } } } } : {}),
  })) }
}

export async function getProctorSessionScope(user: AuthorizedUser): Promise<Prisma.ExamSessionWhereInput> {
  if (user.role === "ADMIN") return {}
  if (user.role !== "PROCTOR") return { id: { in: [] } }
  return buildProctorSessionScope(await prisma.proctorAssignment.findMany({
    where: { proctorId: user.id }, select: { courseId: true, groupId: true },
  }))
}

export async function canAccessExamSession(user: AuthorizedUser, sessionId: string) {
  const scope = user.role === "LEARNER" ? { userId: user.id } : await getProctorSessionScope(user)
  return Boolean(await prisma.examSession.findFirst({ where: { AND: [{ id: sessionId }, scope] }, select: { id: true } }))
}

export async function getSessionProctorRecipients(sessionId: string) {
  const session = await prisma.examSession.findUnique({ where: { id: sessionId }, select: { userId: true, assessment: { select: { courseId: true } } } })
  if (!session) return []
  return prisma.user.findMany({ where: { isActive: true, OR: [
    { role: "ADMIN" },
    { role: "PROCTOR", proctorAssignments: { some: { courseId: session.assessment.courseId, OR: [
      { groupId: null }, { group: { members: { some: { userId: session.userId } } } },
    ] } } },
  ] }, select: { id: true } })
}

export async function publishProctorSessionEvent(sessionId: string, event: string, payload: Record<string, unknown>) {
  const { triggerEvent } = await import("@/lib/pusher")
  const recipients = await getSessionProctorRecipients(sessionId)
  await Promise.all(recipients.map(user => triggerEvent(`private-proctor-user-${user.id}`, event, payload)))
}

export async function notifySessionProctors(sessionId: string, title: string, message: string) {
  const recipients = await getSessionProctorRecipients(sessionId)
  if (recipients.length) await prisma.notification.createMany({ data: recipients.map(user => ({
    userId: user.id, title, message, type: "EXAM", link: `/dashboard/proctor/${sessionId}`,
  })) })
}
