import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { homepageFaqSchema } from "@/lib/homepage-faq-schema"
import { recordStaffAudit } from "@/lib/audit"

export async function GET(request: Request) {
  try {
    const includeDrafts = new URL(request.url).searchParams.get("includeDrafts") === "true"
    if (includeDrafts) await requireApiUser(["ADMIN"])
    return NextResponse.json(await prisma.homepageFaq.findMany({ where: includeDrafts ? undefined : { isPublished: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }))
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to load FAQs") }, { status: apiErrorStatus(error) })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const parsed = homepageFaqSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid FAQ" }, { status: 400 })
    const faq = await prisma.homepageFaq.create({ data: parsed.data })
    await recordStaffAudit(user, "HOMEPAGE_FAQ_CREATE", `Created FAQ "${faq.question}"`)
    return NextResponse.json(faq, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error, "Failed to create FAQ") }, { status: apiErrorStatus(error) })
  }
}
