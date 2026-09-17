import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), manage: vi.fn(), find: vi.fn(), active: vi.fn(), results: vi.fn(), update: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/authorization", () => ({ canManageAssessment: mocks.manage }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user }, $transaction: (callback: (tx: unknown) => unknown) => callback({ $queryRaw: async () => [{ id: "exam" }], assessment: { findUnique: async () => ({ bankLockedAt: null }), update: async () => ({}) }, question: { findFirst: mocks.find, update: mocks.update }, examSession: { count: mocks.active }, assessmentResult: { count: mocks.results } }) } }))
import { PATCH } from "@/app/api/assessments/[id]/questions/[qid]/route"
const context = { params: Promise.resolve({ id: "exam", qid: "question" }) }
const body = { question: "Edited", type: "ESSAY", points: 2 }
const request = (value = body) => new NextRequest("http://localhost/api/assessments/exam/questions/question", { method: "PATCH", body: JSON.stringify(value) })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "admin@example.com" } })
  mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
  mocks.manage.mockResolvedValue(true)
  mocks.find.mockResolvedValue({ id: "question" })
  mocks.active.mockResolvedValue(0)
  mocks.results.mockResolvedValue(0)
  mocks.update.mockResolvedValue({ id: "question", ...body, options: [] })
})
it("updates an owned question atomically with its options", async () => {
  expect((await PATCH(request(), context)).status).toBe(200)
  expect(mocks.find).toHaveBeenCalledWith({ where: { id: "question", assessmentId: "exam" } })
  expect(mocks.update.mock.calls[0][0].data).toMatchObject({ ...body, options: { deleteMany: {}, create: [] } })
})
it("denies missing authentication", async () => { mocks.auth.mockResolvedValue(null); expect((await PATCH(request(), context)).status).toBe(401) })
it("denies a non-manager", async () => { mocks.manage.mockResolvedValue(false); expect((await PATCH(request(), context)).status).toBe(403); expect(mocks.update).not.toHaveBeenCalled() })
it("rejects a question from another assessment", async () => { mocks.find.mockResolvedValue(null); expect((await PATCH(request(), context)).status).toBe(404) })
it("protects an active attempt", async () => { mocks.active.mockResolvedValue(1); expect((await PATCH(request(), context)).status).toBe(409); expect(mocks.update).not.toHaveBeenCalled() })
it("protects historical results", async () => { mocks.results.mockResolvedValue(1); expect((await PATCH(request(), context)).status).toBe(409) })
it("rejects invalid edits", async () => { expect((await PATCH(request({ ...body, points: -1 }), context)).status).toBe(400) })
