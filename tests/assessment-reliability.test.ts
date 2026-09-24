import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), assessment: vi.fn(), enrollment: vi.fn(), blocker: vi.fn(), save: vi.fn(), find: vi.fn(), create: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/learning-path-access", () => ({ getLearningPathBlocker: mocks.blocker }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: (callback: (tx: unknown) => unknown) => callback({ $queryRaw: async () => [{ id: "exam" }], assessment: { findUniqueOrThrow: mocks.assessment, update: async () => ({}) }, examSession: { findFirst: mocks.find, create: mocks.create, updateMany: mocks.save } }),
  user: { findUnique: mocks.user }, assessment: { findUnique: mocks.assessment }, enrollment: { findUnique: mocks.enrollment },
  examSession: { updateMany: mocks.save, findFirst: mocks.find, create: mocks.create },
} }))
import { PATCH } from "@/app/api/assessments/[id]/draft/route"
import { POST as start } from "@/app/api/assessments/[id]/session/route"
import { POST as submit } from "@/app/api/assessments/[id]/submit/route"
const context = { params: Promise.resolve({ id: "exam" }) }
const answers = { q: { selectedOptionId: "option" } }
const request = (body = { sessionId: "session", version: 2, answers }) => new NextRequest("http://localhost/api/assessments/exam/draft", { method: "PATCH", body: JSON.stringify(body) })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "learner@example.com" } })
  mocks.user.mockResolvedValue({ id: "learner", role: "LEARNER" })
  mocks.assessment.mockResolvedValue({ isPublished: true, type: "QUIZ", courseId: "course", questions: [{ id: "q", points: 1, options: [{ id: "option" }] }] })
  mocks.enrollment.mockResolvedValue({ status: "ACTIVE" })
  mocks.blocker.mockResolvedValue(null)
  mocks.save.mockResolvedValue({ count: 1 })
  mocks.find.mockResolvedValue({ draftAnswers: {}, draftVersion: 2, deadlineAt: null })
})
describe("assessment recovery", () => {
  it("explains that staff preview cannot create a learner attempt", async () => {
    mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
    const response = await start(new NextRequest("http://localhost/api/assessments/exam/session", { method: "POST", body: "{}" }), context)
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      code: "LEARNER_ROLE_REQUIRED",
      error: expect.stringContaining("Only learner accounts"),
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("saves only an owned active attempt at the expected version", async () => {
    const response = await PATCH(request(), context)
    expect(await response.json()).toEqual({ version: 3 })
    expect(mocks.save.mock.calls[0][0].where).toEqual({ id: "session", userId: "learner", assessmentId: "exam", status: "IN_PROGRESS", draftVersion: 2 })
  })
  it("rejects unauthenticated autosave", async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await PATCH(request(), context)).status).toBe(401)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("rejects options from another question", async () => {
    expect((await PATCH(request({ sessionId: "session", version: 2, answers: { q: { selectedOptionId: "foreign" } } }), context)).status).toBe(400)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("retains prerequisite enforcement", async () => {
    mocks.blocker.mockResolvedValue({ error: "Complete the prerequisite" })
    expect((await PATCH(request(), context)).status).toBe(403)
    expect(mocks.save).not.toHaveBeenCalled()
  })
  it("does not overwrite a newer tab's draft", async () => {
    mocks.save.mockResolvedValue({ count: 0 })
    mocks.find.mockResolvedValue({ draftAnswers: { q: { content: "different" } } })
    expect((await PATCH(request(), context)).status).toBe(409)
  })
  it("acknowledges an identical save after a lost response", async () => {
    mocks.save.mockResolvedValue({ count: 0 })
    mocks.find.mockResolvedValue({ draftAnswers: answers, draftVersion: 3 })
    expect(await (await PATCH(request(), context)).json()).toEqual({ version: 3 })
  })
  it("resumes answers and the original start time", async () => {
    const startedAt = new Date("2026-09-17T10:00:00Z")
    mocks.find.mockResolvedValue({ id: "session", startedAt, draftAnswers: answers, draftVersion: 2 })
    const response = await start(new NextRequest("http://localhost/api/assessments/exam/session", { method: "POST", body: "{}" }), context)
    expect(await response.json()).toMatchObject({ resumed: true, startedAt: startedAt.toISOString(), answers, version: 2 })
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("recovers submitted confirmation without exposing held scores or answer keys", async () => {
    mocks.assessment.mockResolvedValue({ isPublished: true, releaseScores: false, courseId: "course", questions: [] })
    mocks.find.mockResolvedValue({ result: { id: "result", score: 100, passed: true, attempt: 1, answers: [{ points: 1, content: "secret" }] } })
    const response = await submit(new NextRequest("http://localhost/api/assessments/exam/submit", { method: "POST", body: JSON.stringify({ sessionId: "session", answers: [] }) }), context)
    expect(await response.json()).toMatchObject({ resultId: "result", score: null, earnedPoints: null, passed: null, recovered: true })
    expect(mocks.find.mock.calls[0][0].where).toMatchObject({ userId: "learner", assessmentId: "exam", status: "SUBMITTED" })
  })
  it("rejects a new attempt before the scheduled start", async () => {
    mocks.assessment.mockResolvedValue({ isPublished: true, type: "QUIZ", courseId: "course", startsAt: new Date(Date.now() + 60000) })
    mocks.find.mockResolvedValue(null)
    expect((await start(new NextRequest("http://localhost/api/assessments/exam/session", { method: "POST", body: "{}" }), context)).status).toBe(403)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("rejects a new attempt after the scheduled end", async () => {
    mocks.assessment.mockResolvedValue({ isPublished: true, type: "QUIZ", courseId: "course", endsAt: new Date(Date.now() - 60000) })
    mocks.find.mockResolvedValue(null)
    expect((await start(new NextRequest("http://localhost/api/assessments/exam/session", { method: "POST", body: "{}" }), context)).status).toBe(403)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("allows an existing attempt to resume after closing", async () => {
    mocks.assessment.mockResolvedValue({ isPublished: true, type: "QUIZ", courseId: "course", endsAt: new Date(Date.now() - 60000) })
    mocks.find.mockResolvedValue({ id: "session", startedAt: new Date(), draftAnswers: answers, draftVersion: 2 })
    expect((await start(new NextRequest("http://localhost/api/assessments/exam/session", { method: "POST", body: "{}" }), context)).status).toBe(200)
  })
  it("rejects direct submission outside the scheduled window", async () => {
    mocks.assessment.mockResolvedValue({ isPublished: true, type: "QUIZ", courseId: "course", endsAt: new Date(Date.now() - 60000) })
    expect((await submit(new NextRequest("http://localhost/api/assessments/exam/submit", { method: "POST", body: JSON.stringify({ answers: [] }) }), context)).status).toBe(403)
  })
})
