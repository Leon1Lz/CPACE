import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { certificationCourses, getCertificationCourseBySlug } from "@/data/certification-courses"
import { recordStaffAudit } from "@/lib/audit"
import {
  mapProgramToCourse,
  seedDefaultProgramsIfEmpty,
  normalizeProgramSortOrders,
} from "@/lib/certification-programs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const normalized = id.toLowerCase().trim()

    await seedDefaultProgramsIfEmpty().catch(() => {})

    const record = await prisma.certificationProgram
      .findFirst({
        where: {
          OR: [
            { id },
            { slug: normalized },
            { aliases: { has: normalized } },
          ],
        },
      })
      .catch(() => null)

    if (record) {
      return NextResponse.json(mapProgramToCourse(record))
    }

    const fallback = getCertificationCourseBySlug(normalized)
    if (fallback) {
      return NextResponse.json({
        ...fallback,
        id: fallback.slug,
        isPublished: true,
      })
    }

    return NextResponse.json({ error: "Certification program not found" }, { status: 404 })
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to fetch certification program") },
      { status: apiErrorStatus(error) }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const { id } = await params
    const body = await request.json()

    await seedDefaultProgramsIfEmpty()

    let existing = await prisma.certificationProgram.findFirst({
      where: {
        OR: [{ id }, { slug: id.toLowerCase().trim() }],
      },
    })

    if (!existing) {
      const staticMatch = certificationCourses.find(
        c => c.slug === id.toLowerCase().trim()
      )
      if (staticMatch) {
        const idx = certificationCourses.indexOf(staticMatch)
        existing = await prisma.certificationProgram.create({
          data: {
            slug: staticMatch.slug,
            aliases: staticMatch.aliases || [],
            acronym: staticMatch.acronym,
            parenthesizedAcronym: staticMatch.parenthesizedAcronym,
            fullName: staticMatch.fullName,
            category: staticMatch.category,
            shortDescription: staticMatch.shortDescription,
            heroSubtitle: staticMatch.heroSubtitle,
            badgeImage: staticMatch.badgeImage,
            gradient: staticMatch.gradient,
            lightBg: staticMatch.lightBg,
            lightText: staticMatch.lightText,
            lightBorder: staticMatch.lightBorder,
            formats: staticMatch.formats,
            highlights: staticMatch.highlights as any,
            pillars: staticMatch.pillars as any,
            examFormat: staticMatch.examFormat as any,
            coverageTopics: staticMatch.coverageTopics as any,
            processSteps: staticMatch.processSteps as any,
            investment: staticMatch.investment,
            submissionEmail: staticMatch.submissionEmail,
            registerUrl: staticMatch.registerUrl,
            brochureUrl: staticMatch.brochureUrl || null,
            qualificationCategories: staticMatch.qualificationCategories as any,
            faqs: staticMatch.faqs as any,
            isPublished: true,
            sortOrder: idx + 1,
          },
        })
      }
    }

    if (!existing) {
      return NextResponse.json({ error: "Certification program not found" }, { status: 404 })
    }

    const nextSlug =
      body.slug !== undefined
        ? String(body.slug)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : existing.slug

    if (nextSlug !== existing.slug) {
      const conflict = await prisma.certificationProgram.findUnique({
        where: { slug: nextSlug },
      })
      if (conflict && conflict.id !== existing.id) {
        return NextResponse.json(
          { error: `A program with slug "${nextSlug}" already exists.` },
          { status: 409 }
        )
      }
    }

    const requestedOrder =
      body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
        ? Math.max(1, Math.round(Number(body.sortOrder)))
        : undefined

    // Snapshot the current order list BEFORE changing the target program's sortOrder
    const currentOrderedList =
      requestedOrder !== undefined
        ? await prisma.certificationProgram.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: { id: true, sortOrder: true },
          })
        : []

    const updated = await prisma.certificationProgram.update({
      where: { id: existing.id },
      data: {
        ...(body.slug !== undefined ? { slug: nextSlug } : {}),
        ...(Array.isArray(body.aliases)
          ? { aliases: body.aliases.map((a: any) => String(a).trim()).filter(Boolean) }
          : {}),
        ...(body.acronym !== undefined ? { acronym: String(body.acronym).trim() } : {}),
        ...(body.parenthesizedAcronym !== undefined
          ? { parenthesizedAcronym: String(body.parenthesizedAcronym).trim() }
          : {}),
        ...(body.fullName !== undefined ? { fullName: String(body.fullName).trim() } : {}),
        ...(body.category !== undefined ? { category: String(body.category).trim() } : {}),
        ...(body.shortDescription !== undefined
          ? { shortDescription: String(body.shortDescription).trim() }
          : {}),
        ...(body.heroSubtitle !== undefined
          ? { heroSubtitle: String(body.heroSubtitle).trim() }
          : {}),
        ...(body.badgeImage !== undefined
          ? { badgeImage: String(body.badgeImage).trim() }
          : {}),
        ...(body.gradient !== undefined ? { gradient: String(body.gradient).trim() } : {}),
        ...(body.lightBg !== undefined ? { lightBg: String(body.lightBg).trim() } : {}),
        ...(body.lightText !== undefined ? { lightText: String(body.lightText).trim() } : {}),
        ...(body.lightBorder !== undefined
          ? { lightBorder: String(body.lightBorder).trim() }
          : {}),
        ...(body.formats !== undefined ? { formats: String(body.formats).trim() } : {}),
        ...(Array.isArray(body.highlights) ? { highlights: body.highlights } : {}),
        ...(Array.isArray(body.pillars) ? { pillars: body.pillars } : {}),
        ...(body.examFormat && typeof body.examFormat === "object"
          ? { examFormat: body.examFormat }
          : {}),
        ...(Array.isArray(body.coverageTopics) ? { coverageTopics: body.coverageTopics } : {}),
        ...(Array.isArray(body.processSteps) ? { processSteps: body.processSteps } : {}),
        ...(body.investment !== undefined
          ? { investment: String(body.investment).trim() }
          : {}),
        ...(body.submissionEmail !== undefined
          ? { submissionEmail: String(body.submissionEmail).trim() }
          : {}),
        ...(body.registerUrl !== undefined
          ? { registerUrl: String(body.registerUrl).trim() }
          : {}),
        ...(body.brochureUrl !== undefined
          ? { brochureUrl: body.brochureUrl ? String(body.brochureUrl).trim() : null }
          : {}),
        ...(Array.isArray(body.qualificationCategories)
          ? { qualificationCategories: body.qualificationCategories }
          : {}),
        ...(Array.isArray(body.faqs) ? { faqs: body.faqs } : {}),
        ...(typeof body.isPublished === "boolean" ? { isPublished: body.isPublished } : {}),
      },
    })

    // Re-sequence all programs so moving a program to position N shifts others cleanly (1..total)
    if (requestedOrder !== undefined && currentOrderedList.length > 0) {
      const others = currentOrderedList.filter(p => p.id !== updated.id)
      const insertIndex = Math.min(Math.max(0, requestedOrder - 1), others.length)
      const reorderedIds = [
        ...others.slice(0, insertIndex).map(p => p.id),
        updated.id,
        ...others.slice(insertIndex).map(p => p.id),
      ]
      for (let idx = 0; idx < reorderedIds.length; idx++) {
        const expectedOrder = idx + 1
        await prisma.certificationProgram.update({
          where: { id: reorderedIds[idx] },
          data: { sortOrder: expectedOrder },
        })
      }
      updated.sortOrder = insertIndex + 1
    } else {
      await normalizeProgramSortOrders()
    }

    await recordStaffAudit(
      user,
      "CERTIFICATION_PROGRAM_UPDATE",
      `Updated certification program "${updated.fullName}" (${updated.slug})`
    )

    return NextResponse.json(mapProgramToCourse(updated))
  } catch (error) {
    console.error("Update certification program error:", error)
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to update certification program") },
      { status: apiErrorStatus(error) }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(["ADMIN"])
    const { id } = await params

    const existing = await prisma.certificationProgram.findFirst({
      where: {
        OR: [{ id }, { slug: id.toLowerCase().trim() }],
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Certification program not found" }, { status: 404 })
    }

    await prisma.certificationProgram.delete({
      where: { id: existing.id },
    })

    await normalizeProgramSortOrders()

    await recordStaffAudit(
      user,
      "CERTIFICATION_PROGRAM_DELETE",
      `Deleted certification program "${existing.fullName}" (${existing.slug})`
    )

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("Delete certification program error:", error)
    return NextResponse.json(
      { error: apiErrorMessage(error, "Failed to delete certification program") },
      { status: apiErrorStatus(error) }
    )
  }
}
