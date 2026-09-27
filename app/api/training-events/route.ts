import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiErrorMessage, apiErrorStatus, requireApiUser } from "@/lib/api-auth"
import { recordStaffAudit } from "@/lib/audit"
import { trainingEventSchema } from "@/lib/training-event-schema"

import { defaultTrainingEvents } from "@/data/training-events"

export async function GET(request: Request) {
  try {
    const includeDrafts = new URL(request.url).searchParams.get("includeDrafts") === "true"
    if (includeDrafts) await requireApiUser(["ADMIN"])

    let events = await prisma.trainingEvent.findMany({
      where: includeDrafts ? undefined : { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
    })

    // If database has no training events, auto-seed the default landing page events
    if (events.length === 0) {
      for (const event of defaultTrainingEvents) {
        try {
          await prisma.trainingEvent.create({
            data: {
              title: event.title,
              certification: event.certification,
              startDate: event.startDate,
              endDate: event.endDate,
              time: event.time,
              location: event.location,
              deliveryMode: event.deliveryMode,
              color: event.color,
              spots: event.spots,
              registrationUrl: event.registrationUrl,
              isPublished: event.isPublished,
              sortOrder: event.sortOrder,
            },
          })
        } catch {
          // ignore duplicate or parallel insert
        }
      }
      events = await prisma.trainingEvent.findMany({
        where: includeDrafts ? undefined : { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
      })
    }

    if (events.length === 0) {
      return NextResponse.json(defaultTrainingEvents)
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to load training events:", error)
    return NextResponse.json(defaultTrainingEvents)
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
