import { prisma } from "@/lib/prisma"
import { certificationCourses, type CertificationCourse } from "@/data/certification-courses"

export type CertificationProgramRecord = CertificationCourse & {
  id?: string
  isPublished?: boolean
  sortOrder?: number
}

export function mapProgramToCourse(record: any): CertificationProgramRecord {
  return {
    id: record.id,
    slug: record.slug,
    aliases: Array.isArray(record.aliases) ? record.aliases : [],
    acronym: record.acronym,
    parenthesizedAcronym: record.parenthesizedAcronym || `(${record.acronym})`,
    fullName: record.fullName,
    category: record.category,
    shortDescription: record.shortDescription,
    heroSubtitle: record.heroSubtitle,
    badgeImage: record.badgeImage,
    gradient: record.gradient || "from-emerald-600 to-teal-700",
    lightBg: record.lightBg || "bg-emerald-50",
    lightText: record.lightText || "text-emerald-700",
    lightBorder: record.lightBorder || "border-emerald-200",
    formats: record.formats || "Online, In-person, Hybrid",
    highlights: Array.isArray(record.highlights) ? record.highlights : [],
    pillars: Array.isArray(record.pillars) ? record.pillars : [],
    examFormat:
      record.examFormat && typeof record.examFormat === "object"
        ? record.examFormat
        : {
            overview: "",
            duration: "",
            passingMark: "",
            validity: "",
            authorization: "",
          },
    coverageTopics: Array.isArray(record.coverageTopics) ? record.coverageTopics : [],
    processSteps: Array.isArray(record.processSteps) ? record.processSteps : [],
    investment: record.investment || "",
    submissionEmail: record.submissionEmail || "info@cpaceph.com",
    registerUrl: record.registerUrl || "https://bit.ly/cpaceprograms",
    brochureUrl: record.brochureUrl || undefined,
    qualificationCategories: Array.isArray(record.qualificationCategories)
      ? record.qualificationCategories
      : [],
    faqs: Array.isArray(record.faqs) ? record.faqs : [],
    isPublished: typeof record.isPublished === "boolean" ? record.isPublished : true,
    sortOrder: typeof record.sortOrder === "number" ? record.sortOrder : 0,
  }
}

export async function seedDefaultProgramsIfEmpty() {
  const count = await prisma.certificationProgram.count()
  if (count > 0) return

  for (let idx = 0; idx < certificationCourses.length; idx++) {
    const course = certificationCourses[idx]
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
      update: {},
    })
  }
}

export async function normalizeProgramSortOrders() {
  const all = await prisma.certificationProgram.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, sortOrder: true },
  })
  for (let i = 0; i < all.length; i++) {
    const expected = i + 1
    if (all[i].sortOrder !== expected) {
      await prisma.certificationProgram.update({
        where: { id: all[i].id },
        data: { sortOrder: expected },
      })
    }
  }
}
