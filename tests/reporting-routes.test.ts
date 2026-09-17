import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), directory: vi.fn(), enrollmentGroups: vi.fn(), enrollments: vi.fn(), resultGroups: vi.fn(), aggregate: vi.fn(), results: vi.fn(), courses: vi.fn(), count: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user, findMany: mocks.directory }, enrollment: { groupBy: mocks.enrollmentGroups, findMany: mocks.enrollments },
  assessmentResult: { groupBy: mocks.resultGroups, aggregate: mocks.aggregate, findMany: mocks.results, count: mocks.count }, course: { findMany: mocks.courses },
} }))
import { GET } from "@/app/api/reports/route"
const request = (query = "") => new NextRequest(`http://localhost/api/reports?start=2026-07-01&end=2026-07-31${query ? "&" + query : ""}`)
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "test@example.com" } })
  mocks.user.mockResolvedValue({ id: "user", role: "ADMIN" })
  mocks.directory.mockResolvedValue([]); mocks.enrollments.mockResolvedValue([])
  mocks.enrollmentGroups.mockResolvedValueOnce([{ courseId: "course", status: "COMPLETED", _count: { id: 1 } }, { courseId: "course", status: "ACTIVE", _count: { id: 2 } }, { courseId: "course", status: "DROPPED", _count: { id: 1 } }])
    .mockResolvedValueOnce([{ enrolledAt: new Date("2026-07-15T18:00:00Z"), _count: { id: 4 } }])
  mocks.resultGroups.mockResolvedValueOnce([{ assessmentId: "exam", _count: { id: 5 } }]).mockResolvedValueOnce([{ assessmentId: "exam", _count: { id: 3 } }]).mockResolvedValueOnce([{ assessmentId: "exam", _count: { id: 2 } }])
  mocks.aggregate.mockResolvedValue({ _avg: { score: 80 } }); mocks.count.mockResolvedValue(2)
  mocks.results.mockResolvedValue([{ id: "result", score: 95, passed: true, completedAt: new Date("2026-07-17T12:00:00Z"), assessment: { title: "Held exam", releaseScores: false, scoresReleasedAt: null, questions: [], course: { title: "Course" } } }])
  mocks.courses.mockResolvedValue([{ id: "course", title: "Course", assessments: [{ id: "exam" }] }])
})
it("rejects an expired session before reading report data", async () => {
  mocks.auth.mockResolvedValue(null)
  expect((await GET(request())).status).toBe(401)
  expect(mocks.enrollmentGroups).not.toHaveBeenCalled()
})
it("directs proctors away from learner reports and exports", async () => {
  mocks.user.mockResolvedValue({ id: "proctor", role: "PROCTOR" })
  expect((await GET(request())).status).toBe(403)
  expect((await GET(request("export=results"))).status).toBe(403)
})
it("uses real daily counts, the full enrollment cohort, and auto-scored attempts", async () => {
  const response = await GET(request()); const data = await response.json()
  expect(data.summary).toMatchObject({ enrollments: 4, completed: 1, completionRate: 25, attempts: 5, gradedAttempts: 3, passed: 2, passRate: 66.7, manualReviewSubmissions: 2 })
  expect(data.activity.find((day: { date: string }) => day.date === "2026-07-16").value).toBe(4)
  expect(data.courses[0].passRate).toBe(66.7)
  expect(mocks.resultGroups.mock.calls[1][0].where.AND).toContainEqual({ gradedAt: { not: null } })
})
it("scopes instructor enrollment and submission metrics to assigned courses", async () => {
  mocks.user.mockResolvedValue({ id: "instructor", role: "INSTRUCTOR" })
  expect((await GET(request())).status).toBe(200)
  expect(mocks.enrollmentGroups.mock.calls[0][0].where.AND).toContainEqual({ course: { instructorId: "instructor" } })
  expect(mocks.resultGroups.mock.calls[0][0].where.AND).toContainEqual({ assessment: { course: { instructorId: "instructor" } } })
  expect(mocks.courses.mock.calls[0][0].where).toEqual({ instructorId: "instructor" })
})
it("keeps learner scores held and excludes them from score aggregates", async () => {
  mocks.user.mockResolvedValue({ id: "learner", role: "LEARNER" })
  const data = await (await GET(request())).json()
  expect(data.results[0]).toMatchObject({ score: null, passed: null, scoresReleased: false })
  expect(mocks.resultGroups.mock.calls[0][0].where.AND).toContainEqual({ userId: "learner" })
  expect(mocks.resultGroups.mock.calls[1][0].where.AND[1].assessment.OR).toEqual([{ releaseScores: true }, { scoresReleasedAt: { lte: expect.any(Date) } }])
})
it("uses the same instructor boundary for CSV exports", async () => {
  mocks.user.mockResolvedValue({ id: "instructor", role: "INSTRUCTOR" })
  expect((await GET(request("export=enrollments"))).headers.get("content-type")).toContain("text/csv")
  expect(mocks.enrollments.mock.calls[0][0].where.AND).toContainEqual({ course: { instructorId: "instructor" } })
  expect((await GET(request("export=users"))).status).toBe(403)
})
it("rejects unknown exports and invalid dates rather than silently returning another report", async () => {
  expect((await GET(request("export=unknown"))).status).toBe(400)
  expect((await GET(new NextRequest("http://localhost/api/reports?start=2026-02-30"))).status).toBe(400)
})
it("selects no password/session secrets for directory exports", async () => {
  await GET(request("export=users"))
  expect(mocks.directory.mock.calls[0][0].select).not.toHaveProperty("password")
  expect(mocks.directory.mock.calls[0][0].select).not.toHaveProperty("activeSessionToken")
})
it("fails oversized exports explicitly instead of truncating files", async () => {
  mocks.directory.mockResolvedValue(Array.from({ length: 10001 }, () => ({ id: "user", createdAt: new Date() })))
  expect((await GET(request("export=users"))).status).toBe(413)
})
it("includes finalized manual marks and feedback in learner results after release", async () => {
  mocks.user.mockResolvedValue({ id: "learner", role: "LEARNER" })
  mocks.results.mockResolvedValue([{ id: "manual", score: 80, passed: true, gradedAt: new Date(), completedAt: new Date(), answers: [{ points: 8, feedback: "Well explained", question: { question: "Explain", points: 10 } }], assessment: { title: "Essay", releaseScores: true, questions: [{ type: "ESSAY" }], course: { title: "Course" } } }])
  const data = await (await GET(request())).json()
  expect(data.results[0]).toMatchObject({ score: 80, passed: true, manualReview: false, feedback: [{ feedback: "Well explained", points: 8 }] })
})
it("holds finalized manual marks and feedback until learner score release", async () => {
  mocks.user.mockResolvedValue({ id: "learner", role: "LEARNER" })
  mocks.results.mockResolvedValue([{ id: "manual", score: 80, passed: true, gradedAt: new Date(), completedAt: new Date(), answers: [{ points: 8, feedback: "Hidden feedback", question: { question: "Explain", points: 10 } }], assessment: { title: "Essay", releaseScores: false, questions: [{ type: "ESSAY" }], course: { title: "Course" } } }])
  const data = await (await GET(request())).json()
  expect(data.results[0]).toMatchObject({ score: null, passed: null, feedback: [] })
})
it("does not show provisional manual scores as finalized results", async () => {
  mocks.results.mockResolvedValue([{ id: "manual", score: 100, passed: false, gradedAt: null, completedAt: new Date(), assessment: { title: "Essay", releaseScores: true, questions: [{ type: "ESSAY" }], course: { title: "Course" } } }])
  expect((await (await GET(request())).json()).results[0]).toMatchObject({ score: null, passed: null, manualReview: true, feedback: [] })
})
