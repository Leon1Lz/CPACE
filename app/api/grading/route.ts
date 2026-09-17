import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user || !["ADMIN", "INSTRUCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const status = request.nextUrl.searchParams.get("status") ?? "pending"
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1)
    if (!["pending", "graded"].includes(status) || !Number.isInteger(page) || page < 1 || page > 10000)
      return NextResponse.json({ error: "Invalid grading filter" }, { status: 400 })
    const where = { completedAt: { not: null }, gradedAt: status === "pending" ? null : { not: null },
      assessment: { ...(user.role === "INSTRUCTOR" ? { course: { instructorId: user.id } } : {}), questions: { some: { type: { in: ["SHORT_ANSWER", "ESSAY"] as ("SHORT_ANSWER" | "ESSAY")[] } } } } }
    const [data, total] = await Promise.all([
      prisma.assessmentResult.findMany({ where, skip: (page - 1) * 25, take: 25, orderBy: [{ completedAt: "asc" }, { id: "asc" }],
        select: { id: true, score: true, passed: true, completedAt: true, gradedAt: true, attempt: true,
          user: { select: { firstName: true, lastName: true } },
          assessment: { select: { title: true, passingScore: true, course: { select: { title: true } } } },
          answers: { orderBy: { question: { order: "asc" } }, select: { id: true, content: true, points: true, feedback: true, question: { select: { question: true, type: true, points: true } } } },
        } }),
      prisma.assessmentResult.count({ where }),
    ])
    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / 25) }, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "Unable to load the grading queue" }, { status: 500 }) }
}
