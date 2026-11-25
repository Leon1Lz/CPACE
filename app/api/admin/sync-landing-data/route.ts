import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { articlesData } from "@/data/articles"
import { defaultTrainingEvents } from "@/data/training-events"
import { defaultHomepageFaqs } from "@/data/homepage-faqs"
import { certificationCourses } from "@/data/certification-courses"
import { recordStaffAudit } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const body = await request.json().catch(() => ({}))
    const section = body.section || "all" // "articles" | "schedules" | "faqs" | "programs" | "all"

    const results: {
      articlesSynced?: number
      schedulesSynced?: number
      faqsSynced?: number
      programsSynced?: number
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
              createdAt: new Date(item.createdAt),
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

    // 4. Certification Programs Sync
    if (section === "programs" || section === "all") {
      let count = 0
      for (let idx = 0; idx < certificationCourses.length; idx++) {
        const course = certificationCourses[idx]
        try {
          await prisma.certificationProgram.upsert({
            where: { slug: course.slug },
            create: {
              slug: course.slug,
              aliases: course.aliases || [],
              acronym: course.acronym,
              parenthesizedAcronym: course.parenthesizedAcronym,
              fullName: course.fullName,
              category: course.category,
              shortDescription: course.shortDescription,
              heroSubtitle: course.heroSubtitle,
              badgeImage: course.badgeImage,
              gradient: course.gradient,
              lightBg: course.lightBg,
              lightText: course.lightText,
              lightBorder: course.lightBorder,
              formats: course.formats,
              highlights: course.highlights as any,
              pillars: course.pillars as any,
              examFormat: course.examFormat as any,
              coverageTopics: course.coverageTopics as any,
              processSteps: course.processSteps as any,
              investment: course.investment,
              submissionEmail: course.submissionEmail,
              registerUrl: course.registerUrl,
              brochureUrl: course.brochureUrl || null,
              qualificationCategories: course.qualificationCategories as any,
              faqs: course.faqs as any,
              isPublished: true,
              sortOrder: idx + 1,
            },
            update: {
              aliases: course.aliases || [],
              acronym: course.acronym,
              parenthesizedAcronym: course.parenthesizedAcronym,
              fullName: course.fullName,
              category: course.category,
              shortDescription: course.shortDescription,
              heroSubtitle: course.heroSubtitle,
              badgeImage: course.badgeImage,
              gradient: course.gradient,
              lightBg: course.lightBg,
              lightText: course.lightText,
              lightBorder: course.lightBorder,
              formats: course.formats,
              highlights: course.highlights as any,
              pillars: course.pillars as any,
              examFormat: course.examFormat as any,
              coverageTopics: course.coverageTopics as any,
              processSteps: course.processSteps as any,
              investment: course.investment,
              submissionEmail: course.submissionEmail,
              registerUrl: course.registerUrl,
              brochureUrl: course.brochureUrl || null,
              qualificationCategories: course.qualificationCategories as any,
              faqs: course.faqs as any,
            },
          })
          count++
        } catch (err) {
          console.error("Failed to sync certification program:", course.slug, err)
        }
      }
      results.programsSynced = count
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
    const [articlesCount, eventsCount, faqsCount, programsCount] = await Promise.all([
      prisma.article.count(),
      prisma.trainingEvent.count(),
      prisma.homepageFaq.count(),
      prisma.certificationProgram.count().catch(() => 0),
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
      programs: {
        inDb: programsCount,
        available: certificationCourses.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to inspect landing page data status") },
      { status: apiErrorStatus(error) }
    )
  }
}
