import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(articles)
  } catch (error: any) {
    console.error("GET /api/articles error:", error)
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
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

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt: excerpt || content.substring(0, 150).replace(/<[^>]*>/g, "") + "...",
        content,
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
