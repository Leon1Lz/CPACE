import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignmentSchema = z.object({ proctorId: z.string().min(1).max(100), courseId: z.string().min(1).max(100), groupId: z.string().min(1).max(100).nullable().optional() }).strict()
async function viewer() {
  const session = await getServerSession(authOptions)
  return session ? prisma.user.findUnique({ where: { id: session.user.id } }) : null
}

export async function GET() {
  try {
    const user = await viewer()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["ADMIN", "PROCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const assignments = await prisma.proctorAssignment.findMany({
      where: user.role === "ADMIN" ? {} : { proctorId: user.id }, orderBy: { createdAt: "desc" },
      include: { proctor: { select: { id: true, firstName: true, lastName: true } }, course: { select: { id: true, title: true } }, group: { select: { id: true, name: true } } },
    })
    const [proctors, courses] = user.role === "ADMIN" ? await Promise.all([
      prisma.user.findMany({ where: { role: "PROCTOR", isActive: true }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
      prisma.course.findMany({ select: { id: true, title: true, groups: { select: { group: { select: { id: true, name: true } } } } }, orderBy: { title: "asc" } }),
    ]) : [[], []]
    return NextResponse.json({ assignments, proctors, courses }, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "Unable to load assignments" }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const user = await viewer()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can assign proctors" }, { status: 403 })
    const body = assignmentSchema.parse(await request.json())
    const [proctor, course, groupCourse] = await Promise.all([
      prisma.user.findFirst({ where: { id: body.proctorId, role: "PROCTOR", isActive: true }, select: { id: true } }),
      prisma.course.findUnique({ where: { id: body.courseId }, select: { id: true } }),
      body.groupId ? prisma.groupCourse.findUnique({ where: { groupId_courseId: { groupId: body.groupId, courseId: body.courseId } } }) : Promise.resolve(true),
    ])
    if (!proctor || !course || !groupCourse) return NextResponse.json({ error: "Choose an active proctor, an existing course, and a group linked to that course" }, { status: 400 })
    const assignment = await prisma.$transaction(async tx => {
      const created = await tx.proctorAssignment.upsert({
        where: { proctorId_courseId_scopeKey: { proctorId: body.proctorId, courseId: body.courseId, scopeKey: body.groupId ?? "ALL" } },
        create: { ...body, groupId: body.groupId ?? null, scopeKey: body.groupId ?? "ALL" }, update: {},
      })
      await tx.auditLog.create({ data: { actorId: user.id, action: "PROCTOR_ASSIGNMENT_SAVE", category: "STAFF", details: JSON.stringify({ assignmentId: created.id, ...body }) } })
      return created
    })
    return NextResponse.json({ id: assignment.id })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid assignment" }, { status: 400 })
    return NextResponse.json({ error: "Unable to save assignment" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await viewer()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can remove assignments" }, { status: 403 })
    const { id } = z.object({ id: z.string().min(1).max(100) }).strict().parse(await request.json())
    await prisma.$transaction(async tx => {
      const removed = await tx.proctorAssignment.delete({ where: { id } })
      await tx.auditLog.create({ data: { actorId: user.id, action: "PROCTOR_ASSIGNMENT_REMOVE", category: "STAFF", details: JSON.stringify(removed) } })
    })
    return NextResponse.json({ removed: true })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid assignment" }, { status: 400 })
    return NextResponse.json({ error: "Unable to remove assignment" }, { status: 500 })
  }
}
