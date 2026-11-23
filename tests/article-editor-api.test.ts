import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({ session: vi.fn(), user: vi.fn(), find: vi.fn(), create: vi.fn(), update: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.session }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user }, article: { findUnique: mocks.find, create: mocks.create, update: mocks.update } } }))

import { POST } from "@/app/api/articles/route"
import { PATCH } from "@/app/api/articles/[id]/route"

const content = '<h2 style="text-align:center"><span style="color:#008000">Heading</span></h2><img src="/assets/hero-bg.jpg" alt="Banner"><iframe src="https://www.linkedin.com/embed/feed/update/urn:li:activity:7251234567890123456" height="850"></iframe><script>alert(1)</script>'
beforeEach(() => {
  vi.resetAllMocks()
  mocks.session.mockResolvedValue({ user: { id: "editor" } })
  mocks.user.mockResolvedValue({ id: "editor", role: "ADMIN" })
  mocks.find.mockResolvedValue(null)
  mocks.create.mockImplementation(({ data }) => Promise.resolve({ id: "article", ...data }))
  mocks.update.mockImplementation(({ data }) => Promise.resolve({ id: "article", ...data }))
})

describe("article editor persistence", () => {
  it("saves formatted article content and LinkedIn embeds on create", async () => {
    const response = await POST(new NextRequest("http://localhost/api/articles", { method: "POST", body: JSON.stringify({ title: "Article", content, category: "News" }) }))
    expect(response.status).toBe(201)
    const saved = mocks.create.mock.calls[0][0].data.content
    expect(saved).toContain("text-align: center")
    expect(saved).toContain("<iframe")
    expect(saved).not.toContain("<script")
  })

  it("retains advanced content and edited publication date when an existing article is updated", async () => {
    mocks.find.mockResolvedValue({ id: "article", slug: "article" })
    const publishedAt = "2026-11-06T08:00:00.000Z"
    const response = await PATCH(new NextRequest("http://localhost/api/articles/article", { method: "PATCH", body: JSON.stringify({ content, publishedAt }) }), { params: Promise.resolve({ id: "article" }) })
    expect(response.status).toBe(200)
    const savedData = mocks.update.mock.calls[0][0].data
    const saved = savedData.content
    expect(saved).toContain('height="850"')
    expect(saved).toContain('<img src="/assets/hero-bg.jpg"')
    expect(saved).not.toContain("<script")
    expect(savedData.createdAt).toEqual(new Date(publishedAt))
  })

  it("still prevents unauthenticated article writes", async () => {
    mocks.session.mockResolvedValue(null)
    const response = await POST(new NextRequest("http://localhost/api/articles", { method: "POST", body: JSON.stringify({ title: "Article", content }) }))
    expect(response.status).toBe(401)
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
