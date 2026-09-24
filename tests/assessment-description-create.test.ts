import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  user: vi.fn(),
  canManage: vi.fn(),
  create: vi.fn(),
}))

vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/authorization", () => ({ canManageCourse: mocks.canManage }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.user },
    assessment: { create: mocks.create },
  },
}))

import { POST } from "@/app/api/assessments/route"

function request(description: unknown) {
  return new NextRequest("http://localhost/api/assessments", {
    method: "POST",
    body: JSON.stringify({ title: "Scheduled exam", courseId: "course", description }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "admin" } })
  mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
  mocks.canManage.mockResolvedValue(true)
  mocks.create.mockImplementation(async ({ data }: { data: object }) => ({ id: "exam", ...data }))
})

it("sanitizes WYSIWYG markup when creating an assessment", async () => {
  const response = await POST(request('<h2>Instructions</h2><img src="x" onerror="steal()"><script>alert(1)</script>'))

  expect(response.status).toBe(201)
  expect(mocks.create.mock.calls[0][0].data.description).toBe('<h2>Instructions</h2><img src="x">')
})

it("rejects non-string and oversized assessment descriptions", async () => {
  expect((await POST(request({ unsafe: true }))).status).toBe(400)
  expect((await POST(request(`<p>${"a".repeat(5001)}</p>`))).status).toBe(400)
  expect(mocks.create).not.toHaveBeenCalled()
})
