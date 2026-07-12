import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — assign a course to group + batch enroll all current members
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: groupId } = await params
    const { courseId } = await request.json()
    if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 })

    // Assign course to group
    await prisma.groupCourse.create({ data: { groupId, courseId } })

    // Batch enroll all current group members into this course
    const members = await prisma.groupMember.findMany({ where: { groupId } })
    if (members.length > 0) {
      await prisma.enrollment.createMany({
        data: members.map(m => ({ userId: m.userId, courseId })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ enrolled: members.length })
  } catch {
    return NextResponse.json({ error: "Failed to assign course" }, { status: 500 })
  }
}

// DELETE — remove a course from group
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: groupId } = await params
    const { courseId } = await request.json()
    await prisma.groupCourse.deleteMany({ where: { groupId, courseId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove course" }, { status: 500 })
  }
}
