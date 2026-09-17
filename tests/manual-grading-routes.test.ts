import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), find: vi.fn(), update: vi.fn(), mark: vi.fn(), queue: vi.fn(), count: vi.fn(), certificate: vi.fn(), enrollment: vi.fn(), notification: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user }, assessmentResult: { findMany: mocks.queue, count: mocks.count },
  $transaction: (callback: (tx: unknown) => unknown) => callback({ $queryRaw: async () => [{ id: "exam" }],
    assessmentResult: { findUnique: async () => ({ assessmentId: "exam" }), findUniqueOrThrow: mocks.find, update: mocks.update },
    answer: { update: mocks.mark }, certificate: { findFirst: async () => null, create: mocks.certificate }, enrollment: { updateMany: mocks.enrollment }, notification: { create: mocks.notification },
  }),
} }))
import { GET } from "@/app/api/grading/route"
import { PATCH } from "@/app/api/grading/[id]/route"
const context = { params: Promise.resolve({ id: "result" }) }
const request = (body = { answers: [{ answerId: "answer", points: 8, feedback: "Well explained" }] }) => new NextRequest("http://localhost/api/grading/result", { method: "PATCH", body: JSON.stringify(body) })
const result = () => ({ id: "result", userId: "learner", completedAt: new Date(), gradedAt: null,
  assessment: { type: "FINAL_EXAM", courseId: "course", releaseScores: true, title: "Final", passingScore: 70, course: { instructorId: "instructor", title: "Course" }, questions: [{ id: "essay" }] },
  answers: [{ id: "answer", questionId: "essay", points: 0, question: { id: "essay", type: "ESSAY", points: 10 } }],
})
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "admin@example.com" } })
  mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
  mocks.find.mockResolvedValue(result())
  mocks.queue.mockResolvedValue([]); mocks.count.mockResolvedValue(0)
})
it("finalizes points, result, certificate, enrollment, and notification together", async () => {
  expect((await PATCH(request(), context)).status).toBe(200)
  expect(mocks.update.mock.calls[0][0].data).toMatchObject({ score: 80, passed: true, gradedAt: expect.any(Date), gradedById: "admin" })
  expect(mocks.mark.mock.calls[0][0].data).toMatchObject({ points: 8, feedback: "Well explained" })
  expect(mocks.certificate).toHaveBeenCalledOnce()
  expect(mocks.enrollment).toHaveBeenCalledOnce()
  expect(mocks.notification).toHaveBeenCalledOnce()
})
it("does not issue a held-score certificate", async () => {
  const held = result(); held.assessment.releaseScores = false; mocks.find.mockResolvedValue(held)
  expect((await PATCH(request(), context)).status).toBe(200)
  expect(mocks.certificate).not.toHaveBeenCalled()
  expect(mocks.notification.mock.calls[0][0].data.message).not.toContain("80")
})
it("allows the owning instructor", async () => { mocks.user.mockResolvedValue({ id: "instructor", role: "INSTRUCTOR" }); expect((await PATCH(request(), context)).status).toBe(200) })
it("denies a foreign instructor", async () => { mocks.user.mockResolvedValue({ id: "foreign", role: "INSTRUCTOR" }); expect((await PATCH(request(), context)).status).toBe(403); expect(mocks.mark).not.toHaveBeenCalled() })
it.each(["LEARNER", "PROCTOR"])("denies %s grades and queue access", async role => {
  mocks.user.mockResolvedValue({ id: "other", role })
  expect((await PATCH(request(), context)).status).toBe(403)
  expect((await GET(new NextRequest("http://localhost/api/grading"))).status).toBe(403)
})
it("rejects expired authentication", async () => { mocks.auth.mockResolvedValue(null); expect((await PATCH(request(), context)).status).toBe(401) })
it("prevents duplicate/revised finalization", async () => { mocks.find.mockResolvedValue({ ...result(), gradedAt: new Date() }); expect((await PATCH(request(), context)).status).toBe(409); expect(mocks.update).not.toHaveBeenCalled() })
it("rejects over-maximum marks before any writes", async () => { expect((await PATCH(request({ answers: [{ answerId: "answer", points: 11, feedback: "" }] }), context)).status).toBe(400); expect(mocks.mark).not.toHaveBeenCalled() })
it("rejects an answer belonging to another submission", async () => { expect((await PATCH(request({ answers: [{ answerId: "foreign", points: 8, feedback: "" }] }), context)).status).toBe(400) })
it("protects incomplete legacy answer history", async () => { const old = result(); old.answers = []; mocks.find.mockResolvedValue(old); expect((await PATCH(request(), context)).status).toBe(409) })
it("scopes and paginates instructor queues", async () => {
  mocks.user.mockResolvedValue({ id: "instructor", role: "INSTRUCTOR" })
  expect((await GET(new NextRequest("http://localhost/api/grading?page=2"))).status).toBe(200)
  expect(mocks.queue.mock.calls[0][0]).toMatchObject({ skip: 25, take: 25, where: { gradedAt: null, assessment: { course: { instructorId: "instructor" } } } })
})
it("rejects invalid page/filter values", async () => expect((await GET(new NextRequest("http://localhost/api/grading?page=NaN&status=all"))).status).toBe(400))
