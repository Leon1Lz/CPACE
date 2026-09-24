import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiErrorMessage, apiErrorStatus, requireApiUser } from "@/lib/api-auth"
import { recordStaffAudit } from "@/lib/audit"
import { trainingEventSchema } from "@/lib/training-event-schema"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const parsed = trainingEventSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid event" }, { status: 400 })
    const { id } = await params
    const event = await prisma.trainingEvent.update({ where: { id }, data: parsed.data })
    await recordStaffAudit(user, "TRAINING_EVENT_UPDATE", `Updated homepage event "${event.title}"`)
    return NextResponse.json(event)
  } catch (error) {
    console.error("Failed to update training event:", error)
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to update training event") }, { status: apiErrorStatus(error) })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const { id } = await params
    const event = await prisma.trainingEvent.delete({ where: { id } })
    await recordStaffAudit(user, "TRAINING_EVENT_DELETE", `Deleted homepage event "${event.title}"`)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete training event:", error)
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to delete training event") }, { status: apiErrorStatus(error) })
  }
}
