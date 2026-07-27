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
