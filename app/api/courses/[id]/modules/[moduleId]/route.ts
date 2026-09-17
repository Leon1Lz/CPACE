import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageCourse } from "@/lib/authorization"

// DELETE /api/courses/[id]/modules/[moduleId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, moduleId } = await params
    if (!(await canManageCourse(user, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.courseModule.delete({
      where: { id: moduleId, courseId: id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 })
  }
}
