import { expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ count: vi.fn().mockResolvedValue(17) }))
vi.mock("next-auth/next", () => ({ getServerSession: async () => ({ user: { email: "instructor@example.com" } }) }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: async () => ({ id: "instructor", role: "INSTRUCTOR" }) }, course: { findMany: async () => [] }, assessmentResult: { findMany: async () => [], count: mocks.count }, enrollment: { count: async () => 0 } } }))
import { GET } from "@/app/api/dashboard/stats/route"
it("counts all scoped pending grades independently of the latest five submissions", async () => {
  const response = await GET()
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ pendingGrading: 17 })
  expect(mocks.count.mock.calls[0][0].where).toMatchObject({ gradedAt: null, completedAt: { not: null }, assessment: { course: { instructorId: "instructor" } } })
})
