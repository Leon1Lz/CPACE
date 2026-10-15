import "dotenv/config"
import { prisma } from "../lib/prisma"
import { cfmsReviewerItems, cmmsReviewerItems, comsReviewerItems, type ReviewerItem } from "../lib/reviewer-data"

function categorizeDifficulty(item: ReviewerItem, index: number): "EASY" | "MEDIUM" | "HARD" {
  // If calculation or formula is required, it's typically Medium or Hard
  if (item.formula && (item.formula.includes("WACC") || item.formula.includes("NPV") || item.formula.includes("LTV") || item.formula.includes("EOQ") || item.formula.includes("ROP"))) {
    return "HARD"
  }
  if (item.formula || item.explanation.length > 220) {
    return "MEDIUM"
  }
  // Distribute the rest evenly
  const mod = index % 3
  if (mod === 0) return "EASY"
  if (mod === 1) return "MEDIUM"
  return "HARD"
}

function calculatePoints(difficulty: "EASY" | "MEDIUM" | "HARD"): number {
  switch (difficulty) {
    case "EASY": return 1.0
    case "MEDIUM": return 1.5
    case "HARD": return 2.0
  }
}

export async function integrateTestBanks() {
  console.log("🚀 Starting Course Questions -> Test Banks Integration...")

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, category: true }
  })

  const programConfigs: Record<string, { code: string; title: string; description: string; items: ReviewerItem[] }> = {
    CFMS: {
      code: "QB-CFMS-01",
      title: "CFMS Financial Analysis & Corporate Finance Item Bank",
      description: "Comprehensive question bank covering financial statement analysis, cash flow metrics, working capital management, WACC, and capital budgeting.",
      items: cfmsReviewerItems,
    },
    CMMS: {
      code: "QB-CMMS-01",
      title: "CMMS Strategic Marketing & Customer Analytics Item Bank",
      description: "Question bank focusing on unit economics (CAC, LTV, Churn), market segmentation, omni-channel campaigns, and positioning strategy.",
      items: cmmsReviewerItems,
    },
    COMS: {
      code: "QB-COMS-01",
      title: "COMS Operations & Supply Chain Management Item Bank",
      description: "Question bank addressing inventory models (EOQ, safety stock), capacity utilization, Six Sigma quality control, and Lean flow engineering.",
      items: comsReviewerItems,
    },
  }

  for (const course of courses) {
    const cat = course.category?.toUpperCase() || ""
    let programKey: "CFMS" | "CMMS" | "COMS" | null = null
    if (cat.includes("CFMS") || course.title.toUpperCase().includes("FINANCIAL")) programKey = "CFMS"
    else if (cat.includes("CMMS") || course.title.toUpperCase().includes("MARKETING")) programKey = "CMMS"
    else if (cat.includes("COMS") || course.title.toUpperCase().includes("OPERATION")) programKey = "COMS"

    if (!programKey) {
      console.log(`⏩ Skipping course ${course.title} (no matching program key)`)
      continue
    }

    const config = programConfigs[programKey]

    // 1. Ensure Question Bank exists for this course
    let bank = await prisma.questionBank.findFirst({
      where: { courseId: course.id }
    })

    if (!bank) {
      bank = await prisma.questionBank.create({
        data: {
          courseId: course.id,
          code: config.code,
          title: config.title,
          description: config.description,
        }
      })
      console.log(`✅ Created Question Bank for ${programKey}: ${bank.id}`)
    } else {
      console.log(`ℹ️ Found existing Question Bank for ${programKey}: ${bank.id}`)
    }

    let addedFromReviewer = 0
    let existingCount = 0

    // 2. Insert all 30 curriculum questions from reviewer-data
    for (let i = 0; i < config.items.length; i++) {
      const item = config.items[i]
      const diff = categorizeDifficulty(item, i)
      const points = calculatePoints(diff)

      const existing = await prisma.bankQuestion.findFirst({
        where: { bankId: bank.id, question: item.question }
      })

      if (!existing) {
        await prisma.bankQuestion.create({
          data: {
            bankId: bank.id,
            question: item.question,
            type: "MULTIPLE_CHOICE",
            difficulty: diff,
            points,
            topic: item.keyConcept || "General",
            explanation: item.explanation,
            formula: item.formula || null,
            order: item.order || (i + 1),
            options: {
              create: item.options.map((optText, optIdx) => ({
                text: optText,
                isCorrect: optText === item.correctAnswer,
                order: optIdx + 1,
              })),
            },
          }
        })
        addedFromReviewer++
      } else {
        existingCount++
      }
    }

    // 3. Scan existing Assessments for this course to import any other assessment questions
    const assessments = await prisma.assessment.findMany({
      where: { courseId: course.id },
      include: {
        questions: {
          include: {
            options: { orderBy: { order: "asc" } }
          }
        }
      }
    })

    let addedFromAssessments = 0
    for (const assessment of assessments) {
      for (const q of assessment.questions) {
        const cleanText = q.question.trim()
        const existingInBank = await prisma.bankQuestion.findFirst({
          where: { bankId: bank.id, question: cleanText }
        })

        if (!existingInBank && q.options.length > 0) {
          await prisma.bankQuestion.create({
            data: {
              bankId: bank.id,
              question: cleanText,
              type: q.type,
              difficulty: "MEDIUM",
              points: q.points || 1.0,
              topic: `${assessment.title.replace(course.title, "").trim() || "Assessment Item"}`,
              options: {
                create: q.options.map((opt, optIdx) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  order: opt.order ?? (optIdx + 1),
                }))
              }
            }
          })
          addedFromAssessments++
        }
      }
    }

    const totalQuestionsInBank = await prisma.bankQuestion.count({ where: { bankId: bank.id } })
    console.log(`🎉 [${programKey}] Finished! Added ${addedFromReviewer} from reviewer, ${addedFromAssessments} from assessments (${existingCount} already present). Total questions in bank: ${totalQuestionsInBank}`)
  }

  console.log("✨ Test Bank Integration Complete!")
}

if (process.argv[1]?.includes("integrate-test-banks")) {
  integrateTestBanks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Integration failed:", err)
      process.exit(1)
    })
}
