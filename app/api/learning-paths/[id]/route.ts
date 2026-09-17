import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type StepInput = { type: "COURSE" | "ASSESSMENT"; courseId?: string | null; assessmentId?: string | null; title?: string | null; description?: string | null; isRequired?: boolean }

async function getEditor(userId: string, pathId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !["ADMIN", "INSTRUCTOR"].includes(user.role)) return null
  const path = await prisma.learningPath.findUnique({ where: { id: pathId }, select: { creatorId: true } })
  if (!path || (user.role !== "ADMIN" && path.creatorId !== user.id)) return null
  return user
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const editor = await getEditor(session.user.id, id)
    if (!editor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await request.json()
    const steps: StepInput[] | undefined = Array.isArray(body.steps) ? body.steps : undefined
    const groupIds: string[] | undefined = Array.isArray(body.groupIds) ? Array.from(new Set(body.groupIds.filter((value: unknown): value is string => typeof value === "string"))) : undefined

    if (steps?.some((step) => !["COURSE", "ASSESSMENT"].includes(step.type) || (step.type === "COURSE" ? !step.courseId : !step.assessmentId))) {
      return NextResponse.json({ error: "Every step must have a valid course or assessment" }, { status: 400 })
    }
    if (body.isPublished === true) {
      const current = await prisma.learningPath.findUnique({ where: { id }, select: { _count: { select: { steps: true, groups: true } } } })
      const stepCount = steps ? steps.length : current?._count.steps ?? 0
      const groupCount = groupIds ? groupIds.length : current?._count.groups ?? 0
      if (!stepCount || !groupCount) return NextResponse.json({ error: "Add at least one step and assign at least one group before publishing" }, { status: 400 })
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.learningPath.update({
        where: { id },
        data: {
          ...(typeof body.title === "string" && body.title.trim() && { title: body.title.trim() }),
          ...(typeof body.description === "string" && { description: body.description.trim() || null }),
          ...(typeof body.isPublished === "boolean" && { isPublished: body.isPublished }),
        },
      })
      if (steps) {
        await transaction.learningPathStep.deleteMany({ where: { pathId: id } })
        if (steps.length) await transaction.learningPathStep.createMany({
          data: steps.map((step, index) => ({
            pathId: id,
            type: step.type,
            order: index,
            courseId: step.type === "COURSE" ? step.courseId : null,
            assessmentId: step.type === "ASSESSMENT" ? step.assessmentId : null,
            title: step.title?.trim() || null,
            description: step.description?.trim() || null,
            isRequired: step.isRequired !== false,
          })),
        })
      }
      if (groupIds) {
        await transaction.learningPathGroup.deleteMany({ where: { pathId: id } })
        if (groupIds.length) await transaction.learningPathGroup.createMany({ data: groupIds.map((groupId) => ({ pathId: id, groupId })), skipDuplicates: true })
      }
    })

    // Assigning a path also enrolls current group members in its course content.
    if (groupIds) {
      const [members, savedSteps] = await Promise.all([
        prisma.groupMember.findMany({ where: { groupId: { in: groupIds } }, select: { userId: true, groupId: true } }),
        prisma.learningPathStep.findMany({ where: { pathId: id }, select: { courseId: true, assessment: { select: { courseId: true } } } }),
      ])
      const courseIds = Array.from(new Set(savedSteps.map((step) => step.courseId || step.assessment?.courseId).filter((value): value is string => Boolean(value))))
      if (members.length && courseIds.length) {
        await prisma.enrollment.createMany({ data: members.flatMap((member) => courseIds.map((courseId) => ({ userId: member.userId, courseId }))), skipDuplicates: true })
        await prisma.groupCourse.createMany({ data: groupIds.flatMap((groupId) => courseIds.map((courseId) => ({ groupId, courseId }))), skipDuplicates: true })
      }
    }

    await prisma.auditLog.create({ data: { actorId: editor.id, actorName: `${editor.firstName} ${editor.lastName}`, actorEmail: editor.email, action: "LEARNING_PATH_UPDATE", category: "STAFF", details: `Updated learning path ${id}` } }).catch(() => undefined)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Learning path PATCH error:", error)
    return NextResponse.json({ error: "Failed to update learning path" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const editor = await getEditor(session.user.id, id)
    if (!editor) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    await prisma.learningPath.delete({ where: { id } })
    await prisma.auditLog.create({ data: { actorId: editor.id, actorName: `${editor.firstName} ${editor.lastName}`, actorEmail: editor.email, action: "LEARNING_PATH_DELETE", category: "STAFF", details: `Deleted learning path ${id}` } }).catch(() => undefined)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Learning path DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete learning path" }, { status: 500 })
  }
}
