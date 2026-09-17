import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), user: vi.fn(), assessment: vi.fn(), enrollment: vi.fn(), blocker: vi.fn(), result: vi.fn(), start: vi.fn(),
}))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/learning-path-access", () => ({ getLearningPathBlocker: mocks.blocker }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user }, assessment: { findUnique: mocks.assessment }, enrollment: { findUnique: mocks.enrollment },
  assessmentResult: { create: mocks.result }, examSession: { create: mocks.start },
} }))

import { GET } from "@/app/api/assessments/[id]/route"
import { POST as submit } from "@/app/api/assessments/[id]/submit/route"
import { POST as start } from "@/app/api/assessments/[id]/session/route"

const context = { params: Promise.resolve({ id: "exam-1" }) }
const blocker = { code: "LEARNING_PATH_LOCKED", error: "Complete Foundation first", pathId: "path-1", prerequisite: { id: "course-step", title: "Foundation", href: "/dashboard/courses/course-1" } }

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "learner@example.com" } })
  mocks.user.mockResolvedValue({ id: "learner-1", role: "LEARNER" })
  mocks.assessment.mockResolvedValue({
    id: "exam-1", type: "FINAL_EXAM", isPublished: true, courseId: "course-1",
    course: { id: "course-1", title: "Foundation", instructorId: "instructor-1", enrollments: [{ id: "enrollment-1" }] },
    questions: [],
  })
  mocks.enrollment.mockResolvedValue({ status: "ACTIVE" })
  mocks.blocker.mockResolvedValue(blocker)
})

describe("direct assessment prerequisite guards", () => {
  it("rejects a direct assessment read with actionable prerequisite information", async () => {
    const response = await GET(new NextRequest("http://localhost/api/assessments/exam-1"), context)
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(blocker)
    expect(mocks.blocker).toHaveBeenCalledWith("learner-1", { courseId: "course-1", assessmentId: "exam-1" })
  })

  it("rejects a direct submission before creating a result or issuing a certificate", async () => {
    const response = await submit(new NextRequest("http://localhost/api/assessments/exam-1/submit", {
      method: "POST", body: JSON.stringify({ answers: [] }),
    }), context)
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(blocker)
    expect(mocks.result).not.toHaveBeenCalled()
  })

  it("rejects exam start before creating a session", async () => {
    const response = await start(new NextRequest("http://localhost/api/assessments/exam-1/session", {
      method: "POST", body: JSON.stringify({}),
    }), context)
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(blocker)
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it("allows completed enrollment to reach the normal final-exam proctoring checks", async () => {
    mocks.enrollment.mockResolvedValue({ status: "COMPLETED" })
    mocks.blocker.mockResolvedValue(null)
    const response = await submit(new NextRequest("http://localhost/api/assessments/exam-1/submit", {
      method: "POST", body: JSON.stringify({ answers: [] }),
    }), context)
    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe("A verified proctored session is required")
    expect(mocks.blocker).toHaveBeenCalled()
  })

  it("does not impose learner prerequisite checks on an authorized instructor preview", async () => {
    mocks.user.mockResolvedValue({ id: "instructor-1", role: "INSTRUCTOR" })
    const response = await GET(new NextRequest("http://localhost/api/assessments/exam-1"), context)
    expect(response.status).toBe(200)
    expect(mocks.blocker).not.toHaveBeenCalled()
  })

  it("requires authentication before evaluating prerequisites", async () => {
    mocks.auth.mockResolvedValue(null)
    const response = await GET(new NextRequest("http://localhost/api/assessments/exam-1"), context)
    expect(response.status).toBe(401)
    expect(mocks.blocker).not.toHaveBeenCalled()
  })
})
