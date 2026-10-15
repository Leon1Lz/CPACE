import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  user: vi.fn(),
  assessmentFind: vi.fn(),
  bankFind: vi.fn(),
  bankCreate: vi.fn(),
  bankQuestionFind: vi.fn(),
  bankQuestionCreate: vi.fn(),
  bankQuestionCount: vi.fn(),
  audit: vi.fn(),
}))

vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/audit", () => ({ recordStaffAudit: mocks.audit }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.user },
    assessment: { findUnique: mocks.assessmentFind },
    questionBank: { findFirst: mocks.bankFind, create: mocks.bankCreate },
    bankQuestion: { findFirst: mocks.bankQuestionFind, create: mocks.bankQuestionCreate, count: mocks.bankQuestionCount },
    $transaction: (callback: (tx: any) => Promise<any>) =>
      callback({
        bankQuestion: {
          count: mocks.bankQuestionCount,
          findFirst: mocks.bankQuestionFind,
          create: mocks.bankQuestionCreate,
        },
      }),
  },
}))

import { POST as exportToBank } from "@/app/api/assessments/[id]/export-to-bank/route"

describe("Assessment Bi-Directional Export to Bank and Shuffle Integrity", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "instructor-1" } })
    mocks.user.mockResolvedValue({
      id: "instructor-1",
      role: "INSTRUCTOR",
      email: "instructor@cpace.ph",
      firstName: "Maria",
      lastName: "Santos",
    })
    mocks.bankQuestionCount.mockResolvedValue(10)
  })

  it("exports assessment questions into the course test bank and skips duplicates", async () => {
    mocks.assessmentFind.mockResolvedValue({
      id: "assessment-1",
      title: "Midterm Exam",
      courseId: "course-1",
      course: { id: "course-1", title: "Corporate Finance", category: "CFMS", instructorId: "instructor-1" },
      questions: [
        {
          id: "q-1",
          question: "What is WACC?",
          type: "MULTIPLE_CHOICE",
          points: 2.0,
          order: 1,
          options: [
            { text: "Weighted Average Cost of Capital", isCorrect: true, order: 1 },
            { text: "Working Asset Current Cost", isCorrect: false, order: 2 },
          ],
        },
        {
          id: "q-2",
          question: "Define NPV.",
          type: "SHORT_ANSWER",
          points: 3.0,
          order: 2,
          options: [],
        },
      ],
    })

    mocks.bankFind.mockResolvedValue({
      id: "bank-1",
      title: "CFMS Financial Bank",
    })

    // Suppose q-1 does not exist in bank, but q-2 already exists
    mocks.bankQuestionFind
      .mockResolvedValueOnce(null) // q-1 not existing
      .mockResolvedValueOnce({ id: "bq-existing" }) // q-2 existing

    mocks.bankQuestionCreate.mockResolvedValue({ id: "bq-new" })

    const req = new NextRequest("http://localhost/api/assessments/assessment-1/export-to-bank", {
      method: "POST",
    })
    const res = await exportToBank(req, { params: Promise.resolve({ id: "assessment-1" }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.addedCount).toBe(1)
    expect(data.existingCount).toBe(1)
    expect(mocks.bankQuestionCreate).toHaveBeenCalledTimes(1)
    expect(mocks.audit).toHaveBeenCalled()
  })

  it("rejects unauthorized users without instructor or admin roles", async () => {
    mocks.user.mockResolvedValue({ id: "learner-1", role: "LEARNER" })
    const req = new NextRequest("http://localhost/api/assessments/assessment-1/export-to-bank", {
      method: "POST",
    })
    const res = await exportToBank(req, { params: Promise.resolve({ id: "assessment-1" }) })
    expect(res.status).toBe(403)
  })
})
