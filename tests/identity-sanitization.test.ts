import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), update: vi.fn(), remove: vi.fn(), count: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.find, update: mocks.update, delete: mocks.remove }, course: { count: mocks.count }, group: { count: mocks.count } } }))
import { GET, PATCH, DELETE } from "@/app/api/users/me/route"
import { PATCH as adminUpdate } from "@/app/api/users/route"

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "original", email: "reassigned@example.com", role: "ADMIN" } })
  // A real two-account lookup: selecting by cached email would choose the
  // privileged replacement, while immutable ID selects the original learner.
  mocks.find.mockImplementation(async ({ where }) => where.id === "original"
    ? { id: "original", email: "current@example.com", role: "LEARNER" }
    : { id: "replacement", email: "reassigned@example.com", role: "ADMIN" })
  mocks.update.mockResolvedValue({ id: "original" })
  mocks.remove.mockResolvedValue({ id: "original" })
  mocks.count.mockResolvedValue(0)
})

it("reads the original profile despite a cached email belonging to another user", async () => {
  const response = await GET()
  expect((await response.json()).id).toBe("original")
  expect(mocks.find.mock.calls[0][0].where).toEqual({ id: "original" })
})
it("updates the original profile without touching the replacement account", async () => {
  expect((await PATCH(new NextRequest("http://localhost/api/users/me", { method: "PATCH", body: JSON.stringify({ firstName: "Updated" }) }))).status).toBe(200)
  expect(mocks.update.mock.calls[0][0].where).toEqual({ id: "original" })
})
it("deletes only the original profile", async () => {
  expect((await DELETE()).status).toBe(200)
  expect(mocks.remove).toHaveBeenCalledWith({ where: { id: "original" } })
})
it("does not inherit a replacement account or stale JWT's administrator role", async () => {
  expect((await adminUpdate(new NextRequest("http://localhost/api/users", { method: "PATCH", body: JSON.stringify({ id: "target", isActive: false }) }))).status).toBe(403)
  expect(mocks.update).not.toHaveBeenCalled()
})
it("has no email-based authenticated principal selectors in any API route", () => {
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.name === "route.ts") {
        const source = readFileSync(path, "utf8")
        expect(source, path).not.toMatch(/email:\s*(?:session|auth|authSession)\.user\.email/)
        expect(source, path).not.toMatch(/getEditor\((?:session|auth|authSession)\.user\.email/)
      }
    }
  }
  visit(join(process.cwd(), "app/api"))
})
