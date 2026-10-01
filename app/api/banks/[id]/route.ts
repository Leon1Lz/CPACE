import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateBankSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  code: z.string().max(50).nullable().optional(),
  isArchived: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id } = await params

    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, category: true } },
        questions: {
          include: {
            options: { orderBy: { order: "asc" } },
          },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
        _count: { select: { questions: true, pools: true } },
      },
    })

    if (!bank) {
      return NextResponse.json({ error: "Question bank not found" }, { status: 404 })
    }

    return NextResponse.json(bank)
  } catch (error) {
    console.error("GET /api/banks/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch question bank" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = updateBankSchema.parse(body)

    const updated = await prisma.questionBank.update({
      where: { id },
      data: parsed,
      include: {
        course: { select: { id: true, title: true, category: true } },
        _count: { select: { questions: true, pools: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid bank data", details: error.errors }, { status: 400 })
    }
    console.error("PATCH /api/banks/[id] error:", error)
    return NextResponse.json({ error: "Failed to update question bank" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can delete question banks" }, { status: 403 })
    }

    const { id } = await params

    await prisma.questionBank.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Question bank deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/banks/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete question bank" }, { status: 500 })
  }
}
