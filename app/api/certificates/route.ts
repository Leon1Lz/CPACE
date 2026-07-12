import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
    const skip = (page - 1) * limit

    const where = user.role === "ADMIN" ? {} : { userId: user.id }
    const include = user.role === "ADMIN"
      ? { user: { select: { firstName: true, lastName: true, email: true } }, course: { select: { title: true, category: true } } }
      : { course: { select: { title: true, category: true } } }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({ where, include, orderBy: { issuedAt: "desc" }, skip, take: limit }),
      prisma.certificate.count({ where }),
    ])

    return NextResponse.json({ data: certificates, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
