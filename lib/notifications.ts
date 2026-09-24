/**
 * lib/notifications.ts
 *
 * Server-side notification manager.
 * Creates persistent notifications in the PostgreSQL database.
 */

import { prisma } from "./prisma"

interface CreateNotificationArgs {
  userId: string
  title: string
  message: string
  type?: "INFO" | "SUCCESS" | "WARNING" | "ALERT" | "COURSE" | "EXAM"
  link?: string
}

/**
 * Creates a notification in the database for a specific user.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  link,
}: CreateNotificationArgs) {
  try {
    if (!prisma) return null

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    })

    return notification
  } catch (error) {
    console.error("Error creating database notification:", error)
    return null
  }
}

/**
 * Creates a notification for all users of a specific role (e.g. notify all proctors about a flagged exam).
 */
export async function createRoleNotification({
  role,
  title,
  message,
  type = "INFO",
  link,
}: {
  role: "ADMIN" | "INSTRUCTOR" | "PROCTOR" | "LEARNER"
  title: string
  message: string
  type?: "INFO" | "SUCCESS" | "WARNING" | "ALERT" | "COURSE" | "EXAM"
  link?: string
}) {
  try {
    if (!prisma) return null

    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    })

    if (users.length === 0) return null

    const notificationsData = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link,
    }))

    await prisma.notification.createMany({
      data: notificationsData,
    })

    return { success: true, count: users.length }
  } catch (error) {
    console.error("Error creating role notification:", error)
    return null
  }
}

/** Materializes upcoming learner deadlines as durable, de-duplicated notifications. */
export async function syncLearnerScheduleReminders(userId: string) {
  const now = new Date()
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const today = now.toISOString().slice(0, 10)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [assessments, events] = await Promise.all([
    prisma.assessment.findMany({
      where: {
        isPublished: true,
        course: { enrollments: { some: { userId } } },
        OR: [
          { startsAt: { gt: now, lte: nextDay } },
          { endsAt: { gt: now, lte: nextDay } },
          { scoresReleasedAt: { gt: now, lte: nextDay }, results: { some: { userId, completedAt: { not: null } } } },
        ],
      },
      select: { id: true, title: true, startsAt: true, endsAt: true, scoresReleasedAt: true },
    }),
    prisma.trainingEvent.findMany({ where: { isPublished: true, startDate: { gte: today, lte: nextWeek } }, select: { id: true, title: true, startDate: true } }),
  ])

  const candidates: Array<{ title: string; message: string; type: string; link: string }> = []
  for (const assessment of assessments) {
    const link = `/dashboard/assessments/${assessment.id}/take`
    if (assessment.startsAt && assessment.startsAt > now && assessment.startsAt <= nextDay) candidates.push({ title: "Assessment opens soon", message: `${assessment.title} opens ${assessment.startsAt.toLocaleString()}.`, type: "EXAM", link })
    if (assessment.endsAt && assessment.endsAt > now && assessment.endsAt <= nextDay) candidates.push({ title: "Assessment deadline approaching", message: `${assessment.title} closes ${assessment.endsAt.toLocaleString()}.`, type: "WARNING", link })
    if (assessment.scoresReleasedAt && assessment.scoresReleasedAt > now && assessment.scoresReleasedAt <= nextDay) candidates.push({ title: "Results scheduled for release", message: `${assessment.title} results will be available ${assessment.scoresReleasedAt.toLocaleString()}.`, type: "INFO", link: "/dashboard/reports" })
  }
  for (const event of events) candidates.push({ title: "Upcoming training event", message: `${event.title} starts on ${event.startDate}.`, type: "COURSE", link: "/dashboard/calendar" })
  if (!candidates.length) return 0

  const existing = await prisma.notification.findMany({
    where: { userId, title: { in: [...new Set(candidates.map(candidate => candidate.title))] } },
    select: { title: true, message: true, link: true },
  })
  const existingKeys = new Set(existing.map(notification => `${notification.title}|${notification.message}|${notification.link ?? ""}`))
  const fresh = candidates.filter(candidate => !existingKeys.has(`${candidate.title}|${candidate.message}|${candidate.link}`))
  if (fresh.length) await prisma.notification.createMany({ data: fresh.map(candidate => ({ ...candidate, userId })) })
  return fresh.length
}
