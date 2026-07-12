import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: { orderBy: { order: "asc" } },
          },
        },
        _count: { select: { results: true, questions: true } },
      },
    })

    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(assessment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const data = await request.json()
    const updated = await prisma.assessment.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 })
  }
}
