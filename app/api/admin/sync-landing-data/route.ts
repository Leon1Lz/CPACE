import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { articlesData } from "@/data/articles"
import { defaultTrainingEvents } from "@/data/training-events"
import { defaultHomepageFaqs } from "@/data/homepage-faqs"
import { recordStaffAudit } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const body = await request.json().catch(() => ({}))
    const section = body.section || "all" // "articles" | "schedules" | "faqs" | "all"

    const results: {
      articlesSynced?: number
      schedulesSynced?: number
      faqsSynced?: number
      message?: string
    } = {}

    // 1. Articles Sync
    if (section === "articles" || section === "all") {
      let count = 0
      for (const item of articlesData) {
        try {
          await prisma.article.upsert({
            where: { slug: item.slug },
            create: {
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              content: item.content,
              category: item.category || "Partnership",
              categoryColor: item.categoryColor || "bg-emerald-100 text-emerald-700 border-emerald-200",
              iconName: item.iconName || "users",
              image: item.image,
              featured: !!item.featured,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
            update: {
              title: item.title,
              excerpt: item.excerpt,
              content: item.content,
              category: item.category || "Partnership",
              categoryColor: item.categoryColor,
              iconName: item.iconName,
              image: item.image,
              featured: !!item.featured,
            },
          })
          count++
        } catch (err) {
          console.error("Failed to sync article:", item.slug, err)
        }
      }
      results.articlesSynced = count
    }

    // 2. Training Events / Schedules Sync
    if (section === "schedules" || section === "all") {
      let count = 0
      for (const event of defaultTrainingEvents) {
        try {
          const existing = await prisma.trainingEvent.findFirst({
            where: { title: event.title },
          })
          if (!existing) {
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
            count++
          }
        } catch (err) {
          console.error("Failed to sync training event:", event.title, err)
        }
      }
      results.schedulesSynced = count
    }

    // 3. Homepage FAQs Sync
    if (section === "faqs" || section === "all") {
      let count = 0
      for (const faq of defaultHomepageFaqs) {
        try {
          const existing = await prisma.homepageFaq.findFirst({
            where: { question: faq.question },
          })
          if (!existing) {
            await prisma.homepageFaq.create({
              data: {
                category: faq.category,
                question: faq.question,
                answer: faq.answer,
                isPublished: faq.isPublished,
                sortOrder: faq.sortOrder,
              },
            })
            count++
          }
        } catch (err) {
          console.error("Failed to sync FAQ:", faq.question, err)
        }
      }
      results.faqsSynced = count
    }

    await recordStaffAudit(
      user,
      "LANDING_DATA_SYNC",
      `Synchronized landing page data (${section}): ${JSON.stringify(results)}`
    )

    results.message = "Landing page content successfully synchronized with the database."
    return NextResponse.json(results)
  } catch (error) {
    console.error("Sync landing data error:", error)
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to synchronize landing page data") },
      { status: apiErrorStatus(error) }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(["ADMIN"])
    const [articlesCount, eventsCount, faqsCount] = await Promise.all([
      prisma.article.count(),
      prisma.trainingEvent.count(),
      prisma.homepageFaq.count(),
    ])

    return NextResponse.json({
      articles: {
        inDb: articlesCount,
        available: articlesData.length,
      },
      schedules: {
        inDb: eventsCount,
        available: defaultTrainingEvents.length,
      },
      faqs: {
        inDb: faqsCount,
        available: defaultHomepageFaqs.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to inspect landing page data status") },
      { status: apiErrorStatus(error) }
    )
  }
}
