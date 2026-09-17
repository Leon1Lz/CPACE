import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), assessment: vi.fn(), find: vi.fn(), write: vi.fn(), create: vi.fn(), settings: vi.fn(), marker: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/learning-path-access", () => ({ getLearningPathBlocker: async () => null }))
vi.mock("@/lib/notifications", () => ({ createNotification: async () => undefined }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: async () => ({ id: "learner", role: "LEARNER" }) },
  assessment: { findUnique: mocks.assessment }, enrollment: { findUnique: async () => ({ status: "ACTIVE" }) },
  examSession: { findFirst: mocks.find }, certificate: { findFirst: async () => null },
  $transaction: (callback: (tx: unknown) => unknown) => callback({ $queryRaw: async () => [{ id: "exam" }],
    assessment: { findUniqueOrThrow: mocks.settings, update: mocks.marker },
    examSession: { findFirst: mocks.find, updateMany: mocks.write, update: async () => ({}) },
    assessmentResult: { count: async () => 0, create: mocks.create },
  }),
} }))
import { POST as submit } from "@/app/api/assessments/[id]/submit/route"
import { PATCH as save } from "@/app/api/assessments/[id]/draft/route"
import { examDeadline, examExpired, submissionAnswers } from "@/lib/assessment-timing"
const context = { params: Promise.resolve({ id: "exam" }) }
const exam = { type: "QUIZ", isPublished: true, timeLimit: 1, courseId: "course", questionVersion: 0, course: { title: "Course" }, questions: [{ id: "q", type: "MULTIPLE_CHOICE", points: 1, options: [{ id: "right", text: "Right", isCorrect: true }, { id: "wrong", text: "Wrong", isCorrect: false }] }] }
const active = { id: "session", startedAt: new Date(Date.now() - 120000), deadlineAt: new Date(Date.now() - 60000), draftAnswers: { q: { selectedOptionId: "wrong" } }, draftVersion: 0 }
const request = (body: object, method = "POST") => new NextRequest("http://localhost/api/assessments/exam/submit", { method, body: JSON.stringify(body) })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "learner@example.com" } })
  mocks.assessment.mockResolvedValue(exam)
  mocks.settings.mockResolvedValue({ ...exam, bankLockedAt: new Date() })
  mocks.find.mockImplementation(async (query: { where: { status: string } }) => query.where.status === "SUBMITTED" ? null : active)
  mocks.write.mockResolvedValue({ count: 1 })
  mocks.create.mockResolvedValue({ id: "result" })
})
describe("server deadline enforcement", () => {
  it("late injected correct answers cannot change the saved wrong answer", async () => {
    const response = await submit(request({ sessionId: "session", startedAt: new Date().toISOString(), answers: [{ questionId: "q", selectedOptionId: "right" }] }), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ score: 0, timedOut: true, answerSource: "SERVER_SAVED_DRAFT" })
    expect(mocks.create.mock.calls[0][0].data.answers.create[0]).toMatchObject({ content: "Wrong", points: 0 })
  })
  it("accepts ordinary answers received before the server deadline", async () => {
    mocks.find.mockImplementation(async (query: { where: { status: string } }) => query.where.status === "SUBMITTED" ? null : { ...active, deadlineAt: new Date(Date.now() + 60000) })
    const response = await submit(request({ sessionId: "session", answers: [{ questionId: "q", selectedOptionId: "right" }] }), context)
    expect(await response.json()).toMatchObject({ score: 100, timedOut: false })
  })
  it("rejects timed sessionless submissions even with a forged start time", async () => {
    expect((await submit(request({ startedAt: new Date().toISOString(), answers: [] }), context)).status).toBe(403)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("denies saving new answers after expiration", async () => {
    expect((await save(request({ sessionId: "session", version: 0, answers: { q: { selectedOptionId: "right" } } }, "PATCH"), context)).status).toBe(409)
    expect(mocks.write).not.toHaveBeenCalled()
  })
  it("acknowledges a lost pre-deadline save response after expiration without writing", async () => {
    mocks.find.mockResolvedValue({ ...active, draftVersion: 1 })
    expect((await save(request({ sessionId: "session", version: 0, answers: active.draftAnswers }, "PATCH"), context)).status).toBe(200)
    expect(mocks.write).not.toHaveBeenCalled()
  })
  it("expired empty drafts cannot adopt request answers", async () => {
    mocks.find.mockImplementation(async (query: { where: { status: string } }) => query.where.status === "SUBMITTED" ? null : { ...active, draftAnswers: {} })
    const response = await submit(request({ sessionId: "session", answers: [{ questionId: "q", selectedOptionId: "right" }] }), context)
    expect(await response.json()).toMatchObject({ score: 0 })
  })
  it("counts question changes as a retryable conflict for a first sessionless result", async () => {
    mocks.assessment.mockResolvedValue({ ...exam, timeLimit: null })
    mocks.settings.mockResolvedValue({ ...exam, timeLimit: null, questionVersion: 1 })
    expect((await submit(request({ answers: [] }), context)).status).toBe(409)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("computes immutable deadlines and inclusive expiry", () => {
    const start = new Date("2026-09-17T10:00:00Z")
    expect(examDeadline(start, 60)?.toISOString()).toBe("2026-09-17T11:00:00.000Z")
    expect(examDeadline(start, null)).toBeNull()
    expect(examExpired(start, start)).toBe(true)
    expect(examExpired(null, start)).toBe(false)
  })
  it("rechecks settings when a time limit is enabled during a sessionless submission", async () => {
    mocks.assessment.mockResolvedValue({ ...exam, timeLimit: null })
    expect((await submit(request({ answers: [] }), context)).status).toBe(403)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("rechecks publication at commit", async () => {
    mocks.settings.mockResolvedValue({ ...exam, isPublished: false })
    expect((await submit(request({ sessionId: "session", answers: [] }), context)).status).toBe(403)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("rechecks schedule changes during a sessionless submission", async () => {
    mocks.assessment.mockResolvedValue({ ...exam, timeLimit: null })
    mocks.settings.mockResolvedValue({ ...exam, timeLimit: null, startsAt: new Date(Date.now() + 60000) })
    expect((await submit(request({ answers: [] }), context)).status).toBe(403)
  })
  it("recovers expired verified final drafts after identity-image retention removes photos", async () => {
    mocks.assessment.mockResolvedValue({ ...exam, type: "FINAL_EXAM", requireProctoringConsent: true })
    mocks.settings.mockResolvedValue({ ...exam, type: "FINAL_EXAM", bankLockedAt: new Date() })
    mocks.find.mockImplementation(async (query: { where: { status: string } }) => query.where.status === "SUBMITTED" ? null : { ...active, identityVerifiedAt: active.startedAt, identityPhoto: null, idPhoto: null, consentAt: active.startedAt, cameraStatus: "DISCONNECTED" })
    const response = await submit(request({ sessionId: "session", answers: [{ questionId: "q", selectedOptionId: "right" }] }), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ score: 0, timedOut: true })
  })
  it("does not waive identity verification for an unverified expired final session", async () => {
    mocks.assessment.mockResolvedValue({ ...exam, type: "FINAL_EXAM" })
    expect((await submit(request({ sessionId: "session", answers: [] }), context)).status).toBe(403)
  })
  it("still requires a live verified proctored session before final-exam expiry", async () => {
    mocks.assessment.mockResolvedValue({ ...exam, type: "FINAL_EXAM" })
    mocks.find.mockImplementation(async (query: { where: { status: string } }) => query.where.status === "SUBMITTED" ? null : { ...active, identityVerifiedAt: active.startedAt, deadlineAt: new Date(Date.now() + 60000), cameraStatus: "DISCONNECTED" })
    expect((await submit(request({ sessionId: "session", answers: [] }), context)).status).toBe(403)
  })
  it("does not reinterpret malformed stored drafts as request answers", () => {
    expect(submissionAnswers([{ questionId: "q", content: "late" }], null, true)).toEqual([])
    expect(submissionAnswers([{ questionId: "q", content: "late" }], [], true)).toEqual([])
  })
})
