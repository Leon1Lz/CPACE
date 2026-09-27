import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { homepageFaqSchema } from "@/lib/homepage-faq-schema"
import { recordStaffAudit } from "@/lib/audit"

import { defaultHomepageFaqs } from "@/data/homepage-faqs"

export async function GET(request: Request) {
  try {
    const includeDrafts = new URL(request.url).searchParams.get("includeDrafts") === "true"
    if (includeDrafts) await requireApiUser(["ADMIN"])

    let faqs = await prisma.homepageFaq.findMany({
      where: includeDrafts ? undefined : { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    if (faqs.length === 0) {
      for (const faq of defaultHomepageFaqs) {
        try {
          await prisma.homepageFaq.create({
            data: {
              category: faq.category,
              question: faq.question,
              answer: faq.answer,
              isPublished: faq.isPublished,
              sortOrder: faq.sortOrder,
            },
          })
        } catch {
          // ignore duplicate
        }
      }
      faqs = await prisma.homepageFaq.findMany({
        where: includeDrafts ? undefined : { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    }

    if (faqs.length === 0) {
      return NextResponse.json(defaultHomepageFaqs)
    }

    return NextResponse.json(faqs)
  } catch (error) {
    return NextResponse.json(defaultHomepageFaqs)
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
