import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  user: vi.fn(),
  enrollment: vi.fn(),
  course: vi.fn(),
  createCertificate: vi.fn(),
}))

vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user },
  enrollment: { findFirst: mocks.enrollment },
  course: { findFirst: mocks.course },
  certificate: { create: mocks.createCertificate },
} }))

import { POST } from "@/app/api/certificates/route"

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "ADMIN" } })
  mocks.user.mockResolvedValue({ id: "user-1", role: "ADMIN", isActive: true })
  mocks.enrollment.mockResolvedValue({ course: { id: "course-1", title: "Financial Management" } })
  mocks.createCertificate.mockResolvedValue({ id: "test-certificate" })
})

describe("test certificate generation permissions", () => {
  it.each(["LEARNER", "INSTRUCTOR", "PROCTOR"])("denies %s even when the session claims admin", async role => {
    mocks.user.mockResolvedValue({ id: "user-1", role, isActive: true })
    expect((await POST()).status).toBe(403)
    expect(mocks.enrollment).not.toHaveBeenCalled()
    expect(mocks.createCertificate).not.toHaveBeenCalled()
  })

  it("rejects unauthenticated requests", async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await POST()).status).toBe(401)
    expect(mocks.createCertificate).not.toHaveBeenCalled()
  })

  it("rejects a removed account", async () => {
    mocks.user.mockResolvedValue(null)
    expect((await POST()).status).toBe(404)
    expect(mocks.createCertificate).not.toHaveBeenCalled()
  })

  it("rejects an inactive administrator", async () => {
    mocks.user.mockResolvedValue({ id: "user-1", role: "ADMIN", isActive: false })
    expect((await POST()).status).toBe(403)
    expect(mocks.createCertificate).not.toHaveBeenCalled()
  })

  it("keeps the clearly labelled test certificate available to active administrators", async () => {
    expect((await POST()).status).toBe(201)
    expect(mocks.createCertificate).toHaveBeenCalledWith({ data: expect.objectContaining({
      title: "[TEST] Certificate of Completion — Financial Management",
      userId: "user-1",
      courseId: "course-1",
    }) })
  })
})
