import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { homepageFaqSchema } from "@/lib/homepage-faq-schema"
import { recordStaffAudit } from "@/lib/audit"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const parsed = homepageFaqSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid FAQ" }, { status: 400 })
    const faq = await prisma.homepageFaq.update({ where: { id: (await params).id }, data: parsed.data })
    await recordStaffAudit(user, "HOMEPAGE_FAQ_UPDATE", `Updated FAQ "${faq.question}"`)
    return NextResponse.json(faq)
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to update FAQ") }, { status: apiErrorStatus(error) })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const faq = await prisma.homepageFaq.delete({ where: { id: (await params).id } })
    await recordStaffAudit(user, "HOMEPAGE_FAQ_DELETE", `Deleted FAQ "${faq.question}"`)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to delete FAQ") }, { status: apiErrorStatus(error) })
  }
}
