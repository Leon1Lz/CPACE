import { getServerSession } from "next-auth/next"
import type { UserRole } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
  }
}

export async function requireApiUser(allowedRoles?: UserRole[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) throw new ApiError("Unauthorized", 401)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true, firstName: true, lastName: true, isActive: true },
  })
  if (!user?.isActive) throw new ApiError("Unauthorized", 401)
  if (allowedRoles && !allowedRoles.includes(user.role)) throw new ApiError("Forbidden", 403)
  return user
}

export function apiErrorStatus(error: unknown) {
  return error instanceof ApiError ? error.status : 500
}

export function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}
