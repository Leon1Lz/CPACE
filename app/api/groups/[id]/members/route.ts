import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageGroup } from "@/lib/authorization"

// POST — add members to group (by userIds, emails array, or raw email string) + batch enroll them in all group courses
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: groupId } = await params
    if (!(await canManageGroup(user, groupId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await request.json() as { userIds?: string[]; emails?: string[]; rawEmails?: string }

    let targetUserIds: string[] = []
    let notFoundEmails: string[] = []

    if (Array.isArray(body.userIds) && body.userIds.length > 0) {
      targetUserIds = body.userIds
    } else {
      let emailList: string[] = []
      if (Array.isArray(body.emails) && body.emails.length > 0) {
        emailList = body.emails.map(e => e.trim().toLowerCase()).filter(Boolean)
      } else if (typeof body.rawEmails === "string" && body.rawEmails.trim()) {
        emailList = body.rawEmails
          .split(/[\n,;]+/)
          .map(e => e.trim().toLowerCase())
          .filter(e => e.length > 0 && e.includes("@"))
      }

      if (emailList.length === 0) {
        return NextResponse.json({ error: "No valid user IDs or emails provided" }, { status: 400 })
      }

      const uniqueEmails = Array.from(new Set(emailList))
      const foundUsers = await prisma.user.findMany({
        where: { email: { in: uniqueEmails, mode: "insensitive" } },
        select: { id: true, email: true },
      })

      const foundEmailSet = new Set(foundUsers.map(u => u.email.toLowerCase()))
      targetUserIds = foundUsers.map(u => u.id)
      notFoundEmails = uniqueEmails.filter(e => !foundEmailSet.has(e))
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        error: "No matching registered users found for the provided email list",
        notFoundEmails,
      }, { status: 404 })
    }

    // Add members (skip duplicates)
    const result = await prisma.groupMember.createMany({
      data: targetUserIds.map(userId => ({ groupId, userId })),
      skipDuplicates: true,
    })

    // Get all courses assigned to this group
    const groupCourses = await prisma.groupCourse.findMany({ where: { groupId } })

    // Batch enroll new members into all group courses
    if (groupCourses.length > 0) {
      const enrollData = targetUserIds.flatMap(userId =>
        groupCourses.map(gc => ({ userId, courseId: gc.courseId }))
      )
      await prisma.enrollment.createMany({ data: enrollData, skipDuplicates: true })
    }

    return NextResponse.json({
      success: true,
      added: result.count,
      totalTargeted: targetUserIds.length,
      notFoundEmails,
    })
  } catch (err) {
    console.error("Failed to add group members:", err)
    return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
  }
}

// DELETE — remove a member from group
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: groupId } = await params
    if (!(await canManageGroup(user, groupId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { userId } = await request.json()
    await prisma.groupMember.deleteMany({ where: { groupId, userId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
