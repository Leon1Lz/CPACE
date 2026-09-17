import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageGroup } from "@/lib/authorization"

// DELETE — delete a group
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params
    if (!(await canManageGroup(user, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    await prisma.group.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
  }
}

// PATCH — update group name/description
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params
    if (!(await canManageGroup(user, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { name, description } = await request.json()
    const group = await prisma.group.update({
      where: { id },
      data: { name: name?.trim(), description: description?.trim() || null },
    })
    return NextResponse.json(group)
  } catch {
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 })
  }
}
