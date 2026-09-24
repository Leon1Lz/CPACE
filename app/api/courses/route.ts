import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sanitizeHtml } from "@/lib/sanitize"
import { z } from "zod"

const courseCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string().trim().min(1, "Description is required").max(5000),
  content: z.string().min(1, "Content is required").max(100000),
  category: z.string().trim().min(1, "Category is required").max(100),
  level: z.string().trim().min(1, "Level is required").max(50),
  duration: z.string().trim().min(1, "Duration is required").max(100),
  price: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === undefined || val === null || val === "") return 0
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? 0 : num
  }),
  thumbnail: z.string().max(2000).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
  learningObjectives: z.array(z.string().max(500)).max(50).optional().default([]),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (viewer.role === "PROCTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = viewer.role === "LEARNER"
      ? { status: "PUBLISHED", enrollments: { some: { userId: viewer.id } } }
      : viewer.role === "INSTRUCTOR"
        ? { instructorId: viewer.id }
        : {}
    
    if (category) where.category = category
    if (level) where.level = level
    if (status && viewer.role !== "LEARNER") where.status = status

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
    const skip = (page - 1) * limit

    const include = {
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { enrollments: true, modules: true, assessments: true } },
    }

    const [courses, total, dbTotal, publishedTotal, enrollmentTotal] = await Promise.all([
      prisma.course.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.course.count({ where }),
      prisma.course.count({ where }),
      prisma.course.count({ where: { ...where, status: "PUBLISHED" } }),
      prisma.enrollment.count(viewer.role === "LEARNER" ? { where: { userId: viewer.id } } : undefined),
    ])

    return NextResponse.json({
      data: courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: dbTotal,
        published: publishedTotal,
        enrollments: enrollmentTotal,
      }
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has permission to create courses
    if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = courseCreateSchema.parse(await request.json())

    // Create course
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        content: sanitizeHtml(body.content),
        category: body.category,
        level: body.level,
        duration: body.duration,
        price: body.price,
        thumbnail: body.thumbnail || null,
        status: body.status,
        creatorId: user.id,
        instructorId: user.id, // Set creator as instructor by default
        learningObjectives: body.learningObjectives,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]?.message || "Invalid input"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    console.error("Error creating course:", error)
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    )
  }
}
