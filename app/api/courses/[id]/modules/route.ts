import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeHtml } from "@/lib/sanitize"

// GET /api/courses/[id]/modules — list all modules for a course
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const modules = await prisma.courseModule.findMany({
      where: { courseId: id },
      orderBy: { order: "asc" },
    })
    return NextResponse.json(modules)
  } catch {
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 })
  }
}

// POST /api/courses/[id]/modules — create a new module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { title, description, content, videoUrl, duration } = await request.json()

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

    // Get max order value
    const last = await prisma.courseModule.findFirst({
      where: { courseId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const order = (last?.order ?? 0) + 1

    const module = await prisma.courseModule.create({
      data: {
        title,
        description: description || null,
        content: content ? sanitizeHtml(content) : null,
        videoUrl: videoUrl || null,
        duration: duration ? parseInt(duration) : null,
        order,
        courseId: id,
        isPublished: false,
      },
    })

    return NextResponse.json(module, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 })
  }
}

// PATCH /api/courses/[id]/modules — reorder modules
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { moduleId, ...updateData } = await request.json()

    if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 })

    const allowedFields = ["title", "description", "content", "videoUrl", "duration", "order", "isPublished"]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updateData) {
        data[key] = key === "content" && updateData[key]
          ? sanitizeHtml(updateData[key] as string)
          : key === "duration" && updateData[key] !== null
          ? parseInt(updateData[key] as string)
          : updateData[key]
      }
    }

    const updated = await prisma.courseModule.update({
      where: { id: moduleId, courseId: id },
      data,
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
  }
}
