import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — list all groups (admin/instructor)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const groups = await prisma.group.findMany({
      where: user.role === "ADMIN" ? undefined : { creatorId: user.id },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } } },
        courses: { include: { course: { select: { id: true, title: true, category: true, status: true } } } },
        _count: { select: { members: true, courses: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(groups)
  } catch (e) {
    console.error("[GET /api/groups]", e)
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}

// POST — create a group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description } = await request.json()
    if (typeof name !== "string" || !name.trim() || name.length > 120 || (description != null && (typeof description !== "string" || description.length > 2000))) {
      return NextResponse.json({ error: "Invalid group details" }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: { name: name.trim(), description: description?.trim() || null, creatorId: user.id },
      include: {
        _count: { select: { members: true, courses: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    })

    // Log staff action
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`,
        actorEmail: user.email,
        action: "GROUP_CREATE",
        category: "STAFF",
        details: `Created participant group "${group.name}"`,
      },
    }).catch(() => {})

    return NextResponse.json({ ...group, members: [], courses: [] }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/groups]", e)
    return NextResponse.json({ error: (e as Error).message ?? "Failed to create group" }, { status: 500 })
  }
}
