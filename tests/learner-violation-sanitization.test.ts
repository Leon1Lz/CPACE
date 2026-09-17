import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), find: vi.fn(), update: vi.fn(), event: vi.fn(), audit: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/proctor-access", () => ({ notifySessionProctors: vi.fn(), publishProctorSessionEvent: vi.fn() }))
vi.mock("@/lib/pusher", () => ({ triggerEvent: vi.fn() }))
vi.mock("@/lib/exam-live-store", () => ({ addLiveMotionEvent: vi.fn(), getLiveExamState: () => ({ snapshot: null }) }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user }, examSession: { findFirst: mocks.find, updateMany: mocks.update }, proctoringEvent: { create: mocks.event }, auditLog: { create: mocks.audit } } }))
import { PATCH } from "@/app/api/assessments/[id]/session/route"
const context = { params: Promise.resolve({ id: "exam" }) }
const request = (body: unknown) => new NextRequest("http://localhost/api/assessments/exam/session", { method: "PATCH", body: JSON.stringify(body) })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "learner", email: "learner@example.com" } })
  mocks.user.mockResolvedValue({ id: "learner", role: "LEARNER", firstName: "Test", lastName: "Learner" })
  mocks.find.mockResolvedValue({ status: "IN_PROGRESS", flagReason: "Staff review reason", assessment: { title: "Exam", evidenceCaptureEnabled: false } })
  mocks.update.mockResolvedValue({ count: 1 }); mocks.event.mockResolvedValue({}); mocks.audit.mockResolvedValue({})
})
it.each([
  { sessionId: "session", flagged: false, flagReason: null },
  { sessionId: "session", flagged: "true" },
  { sessionId: "session", flagged: true, flagReason: "x".repeat(1001) },
  { sessionId: "session", flagged: true, status: "SUBMITTED" },
])("rejects flag clearing, coercion and invalid report payloads", async body => {
  expect((await PATCH(request(body), context)).status).toBe(400)
  expect(mocks.update).not.toHaveBeenCalled()
})
it.each(["SUBMITTED", "ABANDONED", "FLAGGED"])("does not mutate a %s session", async status => {
  mocks.find.mockResolvedValue({ status })
  expect((await PATCH(request({ sessionId: "session", flagged: true }), context)).status).toBe(409)
  expect(mocks.update).not.toHaveBeenCalled()
})
it("appends a legitimate violation without replacing staff reasons", async () => {
  expect((await PATCH(request({ sessionId: "session", flagged: true, flagReason: "Face absent" }), context)).status).toBe(200)
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "session", userId: "learner", assessmentId: "exam", status: "IN_PROGRESS" }, data: { flagged: true } })
  expect(mocks.event).toHaveBeenCalledTimes(1)
  expect(mocks.audit).toHaveBeenCalledTimes(1)
})
it("rejects a submission race before recording an incident", async () => {
  mocks.update.mockResolvedValue({ count: 0 })
  expect((await PATCH(request({ sessionId: "session", flagged: true }), context)).status).toBe(409)
  expect(mocks.event).not.toHaveBeenCalled()
})
it("fills a missing gallery reason only if staff have not supplied one concurrently", async () => {
  mocks.find.mockResolvedValue({ status: "IN_PROGRESS", flagReason: null, assessment: { title: "Exam", evidenceCaptureEnabled: false } })
  mocks.update.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
  expect((await PATCH(request({ sessionId: "session", flagged: true, flagReason: "Face absent" }), context)).status).toBe(200)
  expect(mocks.update.mock.calls[1][0]).toEqual({ where: { id: "session", userId: "learner", assessmentId: "exam", status: "IN_PROGRESS", flagReason: null }, data: { flagReason: "Face absent" } })
  expect(mocks.event).toHaveBeenCalledTimes(1)
})
it("denies a foreign session", async () => {
  mocks.find.mockResolvedValue(null)
  expect((await PATCH(request({ sessionId: "foreign", flagged: true }), context)).status).toBe(404)
  expect(mocks.update).not.toHaveBeenCalled()
})
