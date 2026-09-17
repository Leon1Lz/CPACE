import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProctorSessionScope } from "@/lib/proctor-access"

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerSession(authOptions)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!user || !["ADMIN", "PROCTOR"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const filter = request.nextUrl.searchParams.get("filter") ?? "OPEN"
    if (!["OPEN", "PENDING", "ESCALATED", "RESOLVED"].includes(filter)) return NextResponse.json({ error: "Invalid incident filter" }, { status: 400 })
    const reviewStatus = filter === "OPEN" ? { in: ["PENDING", "ESCALATED"] as ("PENDING" | "ESCALATED")[] }
      : filter === "RESOLVED" ? { in: ["REVIEWED", "FALSE_POSITIVE", "CONFIRMED"] as ("REVIEWED" | "FALSE_POSITIVE" | "CONFIRMED")[] }
        : filter as "PENDING" | "ESCALATED"
    const where = { session: await getProctorSessionScope(user), reviewStatus }
    const [incidents, total] = await prisma.$transaction([
      prisma.proctoringEvent.findMany({ where, orderBy: [{ severity: "desc" }, { createdAt: "asc" }, { id: "asc" }], take: 50,
        select: { id: true, sessionId: true, type: true, severity: true, description: true, createdAt: true, reviewStatus: true, reviewNotes: true, reviewedByName: true,
          session: { select: { user: { select: { firstName: true, lastName: true } }, assessment: { select: { title: true } } } } } }),
      prisma.proctoringEvent.count({ where }),
    ])
    return NextResponse.json({ incidents, total }, { headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "Unable to load incident queue" }, { status: 500 }) }
}
