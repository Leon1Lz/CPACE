import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiErrorMessage, apiErrorStatus, requireApiUser } from "@/lib/api-auth"
import { recordStaffAudit } from "@/lib/audit"
import { trainingEventSchema } from "@/lib/training-event-schema"

export async function GET(request: Request) {
  try {
    const includeDrafts = new URL(request.url).searchParams.get("includeDrafts") === "true"
    if (includeDrafts) await requireApiUser(["ADMIN"])

    const events = await prisma.trainingEvent.findMany({
      where: includeDrafts ? undefined : { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to load training events:", error)
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to load training events") }, { status: apiErrorStatus(error) })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const parsed = trainingEventSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid event" }, { status: 400 })
    const event = await prisma.trainingEvent.create({ data: parsed.data })
    await recordStaffAudit(user, "TRAINING_EVENT_CREATE", `Created homepage event "${event.title}"`)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Failed to create training event:", error)
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to create training event") }, { status: apiErrorStatus(error) })
  }
}
