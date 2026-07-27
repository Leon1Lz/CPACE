import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — fetch paginated audit logs for staff / admins / proctors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)
    const category = searchParams.get("category") // "STAFF", "EXAM_SECURITY", or empty for ALL
    const search = searchParams.get("search")?.trim() ?? ""

    const skip = (page - 1) * limit

    const where: any = {}
    if (category && category !== "ALL") {
      where.category = category
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { actorName: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    })
  } catch (err) {
    console.error("Audit log GET error:", err)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}

// POST — create an audit log entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let actorId: string | undefined
    let actorName: string | undefined
    let actorEmail: string | undefined

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        actorId = user.id
        actorName = `${user.firstName} ${user.lastName}`
        actorEmail = user.email
      }
    }

    const body = await request.json()
    const { action, category, details } = body

    if (!action || !category) {
      return NextResponse.json({ error: "action and category are required" }, { status: 400 })
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"

    const auditLog = await prisma.auditLog.create({
      data: {
        actorId,
        actorName: actorName ?? body.actorName ?? "System",
        actorEmail: actorEmail ?? body.actorEmail,
        action,
        category,
        details: typeof details === "object" ? JSON.stringify(details) : details,
        ipAddress,
      },
    })

    return NextResponse.json(auditLog)
  } catch (err) {
    console.error("Audit log POST error:", err)
    return NextResponse.json({ error: "Failed to record audit log" }, { status: 500 })
  }
}
