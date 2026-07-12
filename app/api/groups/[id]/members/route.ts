import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — add members to group + batch enroll them in all group courses
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: groupId } = await params
    const { userIds } = await request.json() as { userIds: string[] }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required" }, { status: 400 })
    }

    // Add members (skip duplicates)
    await prisma.groupMember.createMany({
      data: userIds.map(userId => ({ groupId, userId })),
      skipDuplicates: true,
    })

    // Get all courses assigned to this group
    const groupCourses = await prisma.groupCourse.findMany({ where: { groupId } })

    // Batch enroll new members into all group courses
    if (groupCourses.length > 0) {
      const enrollData = userIds.flatMap(userId =>
        groupCourses.map(gc => ({ userId, courseId: gc.courseId }))
      )
      await prisma.enrollment.createMany({ data: enrollData, skipDuplicates: true })
    }

    return NextResponse.json({ added: userIds.length })
  } catch {
    return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
  }
}

// DELETE — remove a member from group
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: groupId } = await params
    const { userId } = await request.json()
    await prisma.groupMember.deleteMany({ where: { groupId, userId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
