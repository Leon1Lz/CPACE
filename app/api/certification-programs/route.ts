import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { certificationCourses } from "@/data/certification-courses"
import { recordStaffAudit } from "@/lib/audit"
import {
  mapProgramToCourse,
  seedDefaultProgramsIfEmpty,
  normalizeProgramSortOrders,
} from "@/lib/certification-programs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrafts = searchParams.get("includeDrafts") === "true"

    if (includeDrafts) {
      await requireApiUser(["ADMIN"])
    }

    await seedDefaultProgramsIfEmpty()

    const records = await prisma.certificationProgram.findMany({
      where: includeDrafts ? undefined : { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    if (records.length > 0) {
      return NextResponse.json(records.map(mapProgramToCourse))
    }

    return NextResponse.json(
      certificationCourses.map((course, idx) => ({
        ...course,
        id: course.slug,
        isPublished: true,
        sortOrder: idx + 1,
      }))
    )
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      return NextResponse.json(
        { error: apiErrorMessage(error, "Unauthorized") },
        { status: apiErrorStatus(error) }
      )
    }
    console.warn("Falling back to static certification programs:", error)
    return NextResponse.json(
      certificationCourses.map((course, idx) => ({
        ...course,
        id: course.slug,
        isPublished: true,
        sortOrder: idx + 1,
      }))
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const body = await request.json()

    await seedDefaultProgramsIfEmpty()

    const slug = String(body.slug || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
    const fullName = String(body.fullName || "").trim()
    const acronym = String(body.acronym || "").trim()
    const parenthesizedAcronym = String(
      body.parenthesizedAcronym || (acronym ? `(${acronym})` : "")
    ).trim()
    const category = String(body.category || "").trim()

    if (!slug || !fullName || !acronym || !category) {
      return NextResponse.json(
        { error: "Program full name, slug, acronym, and category are required." },
        { status: 400 }
      )
    }

    const existing = await prisma.certificationProgram.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: `A program with slug "${slug}" already exists.` },
        { status: 409 }
      )
    }

    const created = await prisma.certificationProgram.create({
      data: {
        slug,
        aliases: Array.isArray(body.aliases)
          ? body.aliases.map((a: any) => String(a).trim()).filter(Boolean)
          : [],
        acronym,
        parenthesizedAcronym,
        fullName,
        category,
        shortDescription: String(body.shortDescription || "").trim(),
        heroSubtitle: String(body.heroSubtitle || body.shortDescription || "").trim(),
        badgeImage: String(body.badgeImage || "/assets/badges/cfms-badge.png").trim(),
        gradient: String(body.gradient || "from-emerald-600 to-teal-700").trim(),
        lightBg: String(body.lightBg || "bg-emerald-50").trim(),
        lightText: String(body.lightText || "text-emerald-700").trim(),
        lightBorder: String(body.lightBorder || "border-emerald-200").trim(),
        formats: String(body.formats || "Online, In-person, Hybrid").trim(),
        highlights: Array.isArray(body.highlights) ? body.highlights : [],
        pillars: Array.isArray(body.pillars) ? body.pillars : [],
        examFormat:
          body.examFormat && typeof body.examFormat === "object"
            ? body.examFormat
            : {
                overview: "",
                duration: "2 Hours (120 Minutes)",
                questions: "120 Multiple-Choice Questions",
                passingMark: "75% Rating (A minimum score of 60 points is required to pass.)",
                validity: "Lifetime Validity (No renewal required)",
                authorization: "",
              },
        coverageTopics: Array.isArray(body.coverageTopics) ? body.coverageTopics : [],
        processSteps: Array.isArray(body.processSteps) ? body.processSteps : [],
        investment: String(body.investment || "Php 1,680.00").trim(),
        submissionEmail: String(body.submissionEmail || "info@cpaceph.com").trim(),
        registerUrl: String(body.registerUrl || "https://bit.ly/cpaceprograms").trim(),
        brochureUrl: body.brochureUrl ? String(body.brochureUrl).trim() : null,
        qualificationCategories: Array.isArray(body.qualificationCategories)
          ? body.qualificationCategories
          : [],
        faqs: Array.isArray(body.faqs) ? body.faqs : [],
        isPublished: typeof body.isPublished === "boolean" ? body.isPublished : true,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 10,
      },
    })

    await normalizeProgramSortOrders()

    await recordStaffAudit(
      user,
      "CERTIFICATION_PROGRAM_CREATE",
      `Created certification program "${created.fullName}" (${created.slug})`
    )

    return NextResponse.json(mapProgramToCourse(created), { status: 201 })
  } catch (error) {
    console.error("Create certification program error:", error)
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to create certification program") },
      { status: apiErrorStatus(error) }
    )
  }
}
