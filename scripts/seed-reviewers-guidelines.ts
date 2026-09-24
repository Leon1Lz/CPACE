import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { cfmsReviewerItems, cmmsReviewerItems, comsReviewerItems } from "../lib/reviewer-data"
import { courseGuidelines } from "../lib/guidelines-data"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seedReviewersAndGuidelines() {
  console.log("Seeding Reviewers and Rules & Guidelines...")

  const courses = await prisma.course.findMany({
    select: { id: true, title: true }
  })

  for (const course of courses) {
    const titleUpper = course.title.toUpperCase()
    let code: "CFMS" | "CMMS" | "COMS" | null = null
    let reviewerItems = cfmsReviewerItems

    if (titleUpper.includes("FINANCIAL") || titleUpper.includes("CFMS")) {
      code = "CFMS"
      reviewerItems = cfmsReviewerItems
    } else if (titleUpper.includes("MARKETING") || titleUpper.includes("CMMS")) {
      code = "CMMS"
      reviewerItems = cmmsReviewerItems
    } else if (titleUpper.includes("OPERATIONS") || titleUpper.includes("COMS")) {
      code = "COMS"
      reviewerItems = comsReviewerItems
    }

    if (!code) continue

    const guideline = courseGuidelines[code]

    // 1. Rules & Guidelines Assessment
    const guidelineDesc = `
      <div class="space-y-4">
        <p class="text-base text-gray-700 leading-relaxed">${guideline.subtitle}</p>
        <div class="space-y-3 mt-4">
          ${guideline.sections.map(s => `
            <div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <h4 class="font-bold text-gray-900 mb-1">${s.title}</h4>
              <p class="text-sm text-gray-600 mb-2">${s.content}</p>
              <ul class="list-disc list-inside text-xs text-gray-600 space-y-1">
                ${s.bullets.map(b => `<li>${b}</li>`).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
      </div>
    `

    const existingGuidelines = await prisma.assessment.findFirst({
      where: { courseId: course.id, type: "RULES_GUIDELINES" }
    })

    if (existingGuidelines) {
      await prisma.assessment.update({
        where: { id: existingGuidelines.id },
        data: {
          title: `${code} Examination Rules & Guidelines`,
          description: guidelineDesc,
          isPublished: true,
          passingScore: 0,
          attempts: null,
          timeLimit: null,
        }
      })
      console.log(`Updated RULES_GUIDELINES for ${code}`)
    } else {
      await prisma.assessment.create({
        data: {
          courseId: course.id,
          title: `${code} Examination Rules & Guidelines`,
          type: "RULES_GUIDELINES",
          description: guidelineDesc,
          isPublished: true,
          passingScore: 0,
          attempts: null,
          timeLimit: null,
        }
      })
      console.log(`Created RULES_GUIDELINES for ${code}`)
    }

    // 2. Question-Based Reviewer Assessment
    const reviewerDesc = `
      <div class="space-y-3">
        <p class="text-sm text-gray-700 leading-relaxed">
          Comprehensive study reviewer containing 30 core exam questions with full answer rationales, concept definitions, and formulas. Use this self-paced study aid before attempting the practice quiz or proctored final exam.
        </p>
      </div>
    `

    // Clean up or find existing REVIEWER
    let existingReviewer = await prisma.assessment.findFirst({
      where: { courseId: course.id, type: "REVIEWER" }
    })

    if (!existingReviewer) {
      existingReviewer = await prisma.assessment.create({
        data: {
          courseId: course.id,
          title: `${code} Course Question Reviewer & Study Guide`,
          type: "REVIEWER",
          description: reviewerDesc,
          isPublished: true,
          passingScore: 0,
          attempts: null,
          timeLimit: null,
        }
      })
      console.log(`Created REVIEWER for ${code}: ${existingReviewer.id}`)
    } else {
      await prisma.assessment.update({
        where: { id: existingReviewer.id },
        data: {
          title: `${code} Course Question Reviewer & Study Guide`,
          description: reviewerDesc,
          isPublished: true,
          passingScore: 0,
          attempts: null,
          timeLimit: null,
          // Clear old bogus material if it was SGDFG
          ...(existingReviewer.title === "SGDFG" ? { materialUrl: null, materialName: null } : {})
        }
      })
      console.log(`Updated REVIEWER for ${code}: ${existingReviewer.id}`)
    }

    // Ensure questions are seeded for the Reviewer assessment
    const existingQCount = await prisma.question.count({
      where: { assessmentId: existingReviewer.id }
    })

    if (existingQCount === 0) {
      console.log(`Seeding ${reviewerItems.length} questions into Reviewer ${existingReviewer.id}...`)
      for (const item of reviewerItems) {
        await prisma.question.create({
          data: {
            assessmentId: existingReviewer.id,
            question: item.question,
            type: item.options.length === 2 ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
            order: item.order,
            points: 1,
            options: {
              create: item.options.map((optText, oIdx) => ({
                text: optText,
                isCorrect: optText === item.correctAnswer,
                order: oIdx + 1,
              }))
            }
          }
        })
      }
      console.log(`Successfully seeded ${reviewerItems.length} questions for ${code} Reviewer`)
    }
  }

  console.log("All Reviewers and Guidelines seeded successfully!")
}

seedReviewersAndGuidelines()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => pool.end())
