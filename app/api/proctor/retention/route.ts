import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pruneExpiredProctoringEvidence } from "@/lib/proctoring-retention"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    return NextResponse.json(await pruneExpiredProctoringEvidence(true))
  } catch (error) {
    console.error("Evidence retention cleanup failed:", error)
    return NextResponse.json({ error: "Evidence cleanup failed" }, { status: 500 })
  }
}
