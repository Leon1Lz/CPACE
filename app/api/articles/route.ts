import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeHtml, stripTags } from "@/lib/sanitize"
import { articlesData } from "@/data/articles"

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, "-")      // replace spaces and underscores with -
    .replace(/^-+|-+$/g, "")       // trim leading/trailing -
}

export async function GET(req: NextRequest) {
  try {
    let articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    })

    // If database has fewer articles than the default landing page dataset,
    // ensure missing landing page articles are seeded so administrators can see and manage them.
    if (articles.length < articlesData.length) {
      const existingSlugs = new Set(articles.map((a) => a.slug))
      const missing = articlesData.filter((a) => !existingSlugs.has(a.slug))
      if (missing.length > 0) {
        for (const item of missing) {
          try {
            await prisma.article.create({
              data: {
                title: item.title,
                slug: item.slug,
                excerpt: item.excerpt,
                content: item.content,
                category: item.category || "Partnership",
                categoryColor: item.categoryColor || "bg-emerald-100 text-emerald-700 border-emerald-200",
                iconName: item.iconName || "users",
                image: item.image,
                featured: !!item.featured,
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              },
            })
          } catch {
            // In case of parallel request or race condition, ignore
          }
        }
        articles = await prisma.article.findMany({
          orderBy: { createdAt: "desc" },
        })
      }
    }

    if (articles.length === 0) {
      return NextResponse.json(
        articlesData.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          content: a.content,
          category: a.category,
          categoryColor: a.categoryColor,
          iconName: a.iconName,
          image: a.image,
          featured: a.featured,
          createdAt: a.createdAt || new Date().toISOString(),
          updatedAt: a.createdAt || new Date().toISOString(),
        }))
      )
    }

    return NextResponse.json(articles)
  } catch (error: any) {
    console.error("GET /api/articles error:", error)
    return NextResponse.json(
      articlesData.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        category: a.category,
        categoryColor: a.categoryColor,
        iconName: a.iconName,
        image: a.image,
        featured: a.featured,
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.createdAt || new Date().toISOString(),
      }))
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, excerpt, content, category, categoryColor, iconName, image, featured } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    let baseSlug = body.slug ? generateSlug(body.slug) : generateSlug(title)
    if (!baseSlug) {
      baseSlug = "article"
    }

    // Ensure slug uniqueness
    let slug = baseSlug
    let count = 1
    while (true) {
      const existing = await prisma.article.findUnique({ where: { slug } })
      if (!existing) break
      slug = `${baseSlug}-${count}`
      count++
    }

    const cleanContent = sanitizeHtml(content)
    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt
          ? stripTags(excerpt).slice(0, 200)
          : stripTags(cleanContent).slice(0, 150) + "...",
        content: cleanContent,
        category: category || "News",
        categoryColor: categoryColor || "bg-emerald-100 text-emerald-700 border-emerald-200",
        iconName: iconName || "users",
        image: image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        featured: !!featured,
      },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/articles error:", error)
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
  }
}
