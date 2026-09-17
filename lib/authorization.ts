import { prisma } from "@/lib/prisma"

export type AuthorizedUser = {
  id: string
  role: string
}

export function canManageOwnedResource(
  user: AuthorizedUser,
  ownerId: string | null | undefined,
) {
  return user.role === "ADMIN" || (user.role === "INSTRUCTOR" && ownerId === user.id)
}

export async function canManageCourse(user: AuthorizedUser, courseId: string) {
  if (user.role === "ADMIN") return true
  if (user.role !== "INSTRUCTOR") return false
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  })
  return course?.instructorId === user.id
}

export async function canManageAssessment(user: AuthorizedUser, assessmentId: string) {
  if (user.role === "ADMIN") return true
  if (user.role !== "INSTRUCTOR") return false
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { course: { select: { instructorId: true } } },
  })
  return assessment?.course.instructorId === user.id
}

export async function canManageGroup(user: AuthorizedUser, groupId: string) {
  if (user.role === "ADMIN") return true
  if (user.role !== "INSTRUCTOR") return false
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { creatorId: true },
  })
  return group?.creatorId === user.id
}

export const MAX_PROCTOR_IMAGE_BYTES = 2 * 1024 * 1024
const MIN_PROCTOR_IMAGE_BYTES = 1024

export function isSafeImageDataUrl(value: unknown, maxBytes = MAX_PROCTOR_IMAGE_BYTES) {
  if (typeof value !== "string") return false
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) return false
  let image: Buffer
  try {
    image = Buffer.from(match[2], "base64")
  } catch {
    return false
  }
  if (image.length < MIN_PROCTOR_IMAGE_BYTES || image.length > maxBytes) return false

  if (match[1] === "jpeg") {
    return image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
      && image.at(-2) === 0xff && image.at(-1) === 0xd9
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const pngEnd = Buffer.from("IEND")
  return pngSignature.every((byte, index) => image[index] === byte)
    && image.lastIndexOf(pngEnd) >= image.length - 16
}
