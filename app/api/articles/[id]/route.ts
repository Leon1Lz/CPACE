import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try finding by ID first, then by slug
    let article = await prisma.article.findUnique({ where: { id } })
    if (!article) {
      article = await prisma.article.findUnique({ where: { slug: id } })
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error: any) {
    console.error("GET /api/articles/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const existingArticle = await prisma.article.findUnique({ where: { id } })
    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const body = await req.json()
    const { title, excerpt, content, category, categoryColor, iconName, image, featured } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (categoryColor !== undefined) updateData.categoryColor = categoryColor
    if (iconName !== undefined) updateData.iconName = iconName
    if (image !== undefined) updateData.image = image
    if (featured !== undefined) updateData.featured = !!featured

    if (body.slug !== undefined) {
      let baseSlug = generateSlug(body.slug)
      if (baseSlug && baseSlug !== existingArticle.slug) {
        // Ensure new slug is unique
        let slug = baseSlug
        let count = 1
        while (true) {
          const existing = await prisma.article.findUnique({ where: { slug } })
          if (!existing || existing.id === id) break
          slug = `${baseSlug}-${count}`
          count++
        }
        updateData.slug = slug
      }
    } else if (title !== undefined && title !== existingArticle.title) {
      // Auto-update slug if title changed and slug wasn't explicitly edited
      let baseSlug = generateSlug(title)
      if (baseSlug) {
        let slug = baseSlug
        let count = 1
        while (true) {
          const existing = await prisma.article.findUnique({ where: { slug } })
          if (!existing || existing.id === id) break
          slug = `${baseSlug}-${count}`
          count++
        }
        updateData.slug = slug
      }
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedArticle)
  } catch (error: any) {
    console.error("PATCH /api/articles/[id] error:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const existingArticle = await prisma.article.findUnique({ where: { id } })
    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    await prisma.article.delete({ where: { id } })

    return NextResponse.json({ message: "Article deleted successfully" })
  } catch (error: any) {
    console.error("DELETE /api/articles/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
  }
}
