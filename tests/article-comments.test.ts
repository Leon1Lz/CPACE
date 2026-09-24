import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  findArticle: vi.fn(),
  findComments: vi.fn(),
  findDuplicate: vi.fn(),
  createComment: vi.fn(),
  sendCommentEmails: vi.fn(),
}))

vi.mock("@/data/articles", () => ({ articlesData: [{ slug: "built-in-article" }] }))
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "127.0.0.1", rateLimit: () => ({ success: true }) }))
vi.mock("@/lib/article-comment-email", () => ({ sendArticleCommentEmails: mocks.sendCommentEmails }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: { findFirst: mocks.findArticle },
    articleComment: {
      findMany: mocks.findComments,
      findFirst: mocks.findDuplicate,
      create: mocks.createComment,
    },
  },
}))

import { GET, POST } from "@/app/api/articles/[id]/comments/route"

const context = { params: Promise.resolve({ id: "managed-article" }) }

describe("article comments", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.findArticle.mockResolvedValue({ slug: "managed-article", title: "Managed article" })
    mocks.findComments.mockResolvedValue([])
    mocks.findDuplicate.mockResolvedValue(null)
    mocks.createComment.mockResolvedValue({ id: "comment-1", name: "Reader", content: "Useful article", createdAt: new Date("2026-09-21T00:00:00Z") })
    mocks.sendCommentEmails.mockResolvedValue({ notification: { success: true }, acknowledgment: null })
  })

  it("returns public fields without exposing commenter email", async () => {
    mocks.findComments.mockResolvedValue([{ id: "comment-1", name: "Reader", content: "Useful", createdAt: new Date("2026-09-21T00:00:00Z") }])
    const response = await GET(new NextRequest("http://localhost/api/articles/managed-article/comments"), context)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.comments[0]).not.toHaveProperty("email")
    expect(mocks.findComments.mock.calls[0][0].select).not.toHaveProperty("email")
  })

  it("normalizes email and stores a plain-text public comment", async () => {
    const response = await POST(new NextRequest("http://localhost/api/articles/managed-article/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Reader", email: "READER@EXAMPLE.COM", comment: "Useful article", website: "" }),
    }), context)
    expect(response.status).toBe(201)
    expect(mocks.createComment).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: "reader@example.com", content: "Useful article" }),
    }))
    expect(mocks.sendCommentEmails).toHaveBeenCalledWith(expect.objectContaining({ articleTitle: "Managed article", email: "reader@example.com" }))
  })

  it("rejects invalid email addresses", async () => {
    const response = await POST(new NextRequest("http://localhost/api/articles/managed-article/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Reader", email: "invalid", comment: "Useful article", website: "" }),
    }), context)
    expect(response.status).toBe(400)
    expect(mocks.createComment).not.toHaveBeenCalled()
  })
})
