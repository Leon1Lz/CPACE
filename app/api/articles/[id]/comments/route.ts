import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { articlesData } from "@/data/articles"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimit } from "@/lib/rate-limit"
import { stripTags } from "@/lib/sanitize"

const commentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  comment: z.string().trim().min(2).max(2000),
  website: z.string().max(200).optional().default(""),
}).strict()

async function resolveArticle(id: string) {
  const managed = await prisma.article.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { slug: true, title: true },
  })
  if (managed) return managed
  const builtIn = articlesData.find((article) => article.slug === id)
  return builtIn ? { slug: builtIn.slug, title: builtIn.title } : null
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const article = await resolveArticle(id)
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 })

    const comments = await prisma.articleComment.findMany({
      where: { articleSlug: article.slug, isVisible: true },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, content: true, createdAt: true },
    })
    return NextResponse.json({ comments, count: comments.length }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Article comments GET failed:", error)
    return NextResponse.json({ error: "Unable to load comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limit = rateLimit(`article-comment:${getClientIp(request)}`, 5, 15 * 60 * 1000)
    if (!limit.success) return NextResponse.json({ error: "Too many comments. Please try again later." }, { status: 429 })

    const parsed = commentSchema.parse(await request.json())
    // Honeypot field: accept the request without publishing bot submissions.
    if (parsed.website) return NextResponse.json({ success: true }, { status: 201 })

    const { id } = await params
    const article = await resolveArticle(id)
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 })

    const name = stripTags(parsed.name).trim()
    const content = stripTags(parsed.comment).trim()
    if (name.length < 2 || content.length < 2) {
      return NextResponse.json({ error: "Please enter a valid name and comment." }, { status: 400 })
    }

    const email = parsed.email.toLowerCase()
    const duplicate = await prisma.articleComment.findFirst({
      where: {
        articleSlug: article.slug,
        email,
        content,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    })
    if (duplicate) return NextResponse.json({ error: "This comment was already submitted." }, { status: 409 })

    const comment = await prisma.articleComment.create({
      data: { articleSlug: article.slug, name, email, content },
      select: { id: true, name: true, content: true, createdAt: true },
    })
    try {
      const { sendArticleCommentEmails } = await import("@/lib/article-comment-email")
      await sendArticleCommentEmails({ articleTitle: article.title, articleSlug: article.slug, name, email, comment: content })
    } catch {
      // The public comment remains published if optional email delivery fails.
      console.error("Article comment email notification failed.")
    }
    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Please provide a valid name, email, and comment." }, { status: 400 })
    }
    console.error("Article comment submission failed:", error)
    return NextResponse.json({ error: "Unable to publish your comment. Please try again." }, { status: 500 })
  }
}
