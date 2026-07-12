import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const includeModules = req.nextUrl.searchParams.get("modules") === "true"

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { enrollments: true, modules: true, assessments: true } },
        ...(includeModules ? {
          modules: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, description: true, content: true, videoUrl: true, order: true, duration: true },
          },
        } : {}),
      },
    })
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(course)
  } catch {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()

    const allowedFields = ["title", "description", "content", "category", "level", "duration", "price", "thumbnail", "status", "learningObjectives"]
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in data) updateData[key] = data[key]
    }

    const updated = await prisma.course.update({ where: { id }, data: updateData })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    await prisma.course.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
