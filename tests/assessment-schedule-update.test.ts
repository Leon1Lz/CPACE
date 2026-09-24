import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), find: vi.fn(), update: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user }, assessment: { findUnique: mocks.find, update: mocks.update }, $transaction: (callback: (tx: unknown) => unknown) => callback({ $queryRaw: async () => [{ id: "exam" }], assessment: { findUniqueOrThrow: mocks.find, update: mocks.update } }) } }))
import { PATCH } from "@/app/api/assessments/[id]/route"
const context = { params: Promise.resolve({ id: "exam" }) }
const request = (body: object) => new NextRequest("http://localhost/api/assessments/exam", { method: "PATCH", body: JSON.stringify(body) })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "admin@example.com" } })
  mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
  mocks.find.mockResolvedValue({ course: { instructorId: "instructor" }, startsAt: new Date("2026-09-17T10:00:00Z"), endsAt: null, releaseScores: true })
  mocks.update.mockResolvedValue({ releaseScores: true })
})
it("saves ISO schedule dates as dates", async () => {
  expect((await PATCH(request({ startsAt: "2026-09-17T18:00:00+08:00", endsAt: "2026-09-17T20:00:00+08:00" }), context)).status).toBe(200)
  expect(mocks.update.mock.calls[0][0].data.startsAt.toISOString()).toBe("2026-09-17T10:00:00.000Z")
})
it("rejects an end before the persisted start on partial updates", async () => {
  expect((await PATCH(request({ endsAt: "2026-09-17T09:00:00Z" }), context)).status).toBe(400)
  expect(mocks.update).not.toHaveBeenCalled()
})
it("clears schedule boundaries", async () => expect((await PATCH(request({ startsAt: null, endsAt: null }), context)).status).toBe(200))
it("sanitizes rich assessment descriptions before saving", async () => {
  expect((await PATCH(request({ description: '<h2>Instructions</h2><script>alert("xss")</script><p onclick="steal()">Bring an ID.</p>' }), context)).status).toBe(200)
  expect(mocks.update.mock.calls[0][0].data.description).toBe("<h2>Instructions</h2><p>Bring an ID.</p>")
})
it("rejects oversized rich assessment descriptions", async () => {
  expect((await PATCH(request({ description: `<p>${"a".repeat(5001)}</p>` }), context)).status).toBe(400)
  expect(mocks.update).not.toHaveBeenCalled()
})
it("rejects malformed dates", async () => expect((await PATCH(request({ startsAt: "not-a-date" }), context)).status).toBe(400))
it("denies a proctor", async () => { mocks.user.mockResolvedValue({ id: "proctor", role: "PROCTOR" }); expect((await PATCH(request({ startsAt: null }), context)).status).toBe(403) })
it("denies a foreign instructor", async () => { mocks.user.mockResolvedValue({ id: "foreign", role: "INSTRUCTOR" }); expect((await PATCH(request({ startsAt: null }), context)).status).toBe(403) })
it("locks duration and passing-score changes after attempts begin", async () => {
  mocks.find.mockResolvedValue({ bankLockedAt: new Date(), timeLimit: 60, passingScore: 70, course: { instructorId: "instructor" }, releaseScores: true })
  expect((await PATCH(request({ timeLimit: 120 }), context)).status).toBe(409)
  expect((await PATCH(request({ passingScore: 10 }), context)).status).toBe(409)
  expect(mocks.update).not.toHaveBeenCalled()
})
it("permits unchanged duration and schedule edits on a used assessment", async () => {
  mocks.find.mockResolvedValue({ bankLockedAt: new Date(), timeLimit: 60, passingScore: 70, course: { instructorId: "instructor" }, releaseScores: true })
  expect((await PATCH(request({ timeLimit: 60, endsAt: "2026-09-17T20:00:00Z" }), context)).status).toBe(200)
})
