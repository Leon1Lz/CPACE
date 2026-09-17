import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), course: vi.fn(), enrollment: vi.fn(), modules: vi.fn(), update: vi.fn(), blocker: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/learning-path-access", () => ({ getLearningPathBlocker: mocks.blocker }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user }, course: { findUnique: mocks.course }, enrollment: { findUnique: mocks.enrollment, updateMany: mocks.update }, courseModule: { findMany: mocks.modules } } }))
import { GET as courseRead } from "@/app/api/courses/[id]/route"
import { GET as modulesRead } from "@/app/api/courses/[id]/modules/route"
import { PATCH as progress } from "@/app/api/enrollments/route"
const context = { params: Promise.resolve({ id: "course" }) }
const request = () => new NextRequest("http://localhost/api/courses/course?modules=true")
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "test@example.com" } }); mocks.user.mockResolvedValue({ id: "user", role: "LEARNER" })
  mocks.course.mockResolvedValue({ id: "course", status: "PUBLISHED", instructorId: "instructor", instructor: { id: "instructor" } })
  mocks.enrollment.mockResolvedValue({ id: "enrollment", status: "ACTIVE", completedModules: ["old"], completedAt: null, course: { status: "PUBLISHED" } })
  mocks.modules.mockResolvedValue([{ id: "old" }, { id: "new" }]); mocks.blocker.mockResolvedValue(null); mocks.update.mockResolvedValue({ count: 1 })
})
it.each([["ADMIN", "admin", 200], ["INSTRUCTOR", "instructor", 200], ["INSTRUCTOR", "other", 403], ["PROCTOR", "proctor", 403], ["LEARNER", "learner", 200]])("course read respects %s ownership for %s", async (role, id, expected) => {
  mocks.user.mockResolvedValue({ role, id })
  expect((await courseRead(request(), context)).status).toBe(expected)
})
it.each(["SUSPENDED", "DROPPED"])("denies %s enrollment on both course and module reads", async status => {
  mocks.enrollment.mockResolvedValue({ id: "enrollment", status, course: { status: "PUBLISHED" } })
  expect((await courseRead(request(), context)).status).toBe(403)
  expect((await modulesRead(request(), context)).status).toBe(403)
  expect(mocks.modules).not.toHaveBeenCalled()
})
it("allows completed learners to review published course modules", async () => {
  mocks.enrollment.mockResolvedValue({ id: "enrollment", status: "COMPLETED", course: { status: "PUBLISHED" } })
  expect((await modulesRead(request(), context)).status).toBe(200)
  expect(mocks.modules.mock.calls[0][0].where).toMatchObject({ courseId: "course", isPublished: true })
})
it("rejects missing course data without a successful-looking empty payload", async () => {
  mocks.course.mockResolvedValue(null)
  expect((await courseRead(request(), context)).status).toBe(404)
})
it("rejects learner module access to an unpublished parent course", async () => {
  mocks.enrollment.mockResolvedValue({ id: "enrollment", status: "ACTIVE", course: { status: "DRAFT" } })
  expect((await modulesRead(request(), context)).status).toBe(403)
})
it("requires authentication on course reads and progress updates", async () => {
  mocks.auth.mockResolvedValue(null)
  expect((await courseRead(request(), context)).status).toBe(401)
  expect((await progress(new NextRequest("http://localhost/api/enrollments?courseId=course", { method: "PATCH", body: "{}" }))).status).toBe(401)
})
it("verifies published module IDs rather than trusting a client completion percentage", async () => {
  const response = await progress(new NextRequest("http://localhost/api/enrollments?courseId=course", { method: "PATCH", body: JSON.stringify({ completedModules: ["new"], progress: 0 }) }))
  expect(await response.json()).toMatchObject({ progress: 100, status: "COMPLETED", completedModules: ["old", "new"] })
  expect(mocks.update.mock.calls[0][0].where).toEqual({ userId: "user", courseId: "course" })
})
it("rejects foreign module IDs without advancing the learner", async () => {
  const response = await progress(new NextRequest("http://localhost/api/enrollments?courseId=course", { method: "PATCH", body: JSON.stringify({ completedModules: ["foreign"] }) }))
  expect(response.status).toBe(400); expect(mocks.update).not.toHaveBeenCalled()
})
