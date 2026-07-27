import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Email verification helper
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/admin/pre-approved-emails — Fetch whitelisted emails (with search & pagination)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const skip = (page - 1) * limit

    const where = search
      ? { email: { contains: search, mode: "insensitive" as const } }
      : {}

    const [data, total] = await Promise.all([
      prisma.preApprovedEmail.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.preApprovedEmail.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[GET /api/admin/pre-approved-emails]", error)
    return NextResponse.json({ error: "Failed to fetch pre-approved emails" }, { status: 500 })
  }
}

// POST /api/admin/pre-approved-emails — Bulk add whitelisted emails
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { rawEmails, role } = await req.json()
    if (!rawEmails || typeof rawEmails !== "string") {
      return NextResponse.json({ error: "rawEmails must be a non-empty string" }, { status: 400 })
    }

    const targetRole = role || "LEARNER"
    if (!["ADMIN", "INSTRUCTOR", "LEARNER", "PROCTOR"].includes(targetRole)) {
      return NextResponse.json({ error: "Invalid role value" }, { status: 400 })
    }

    // Split text by newlines, commas, semicolons, or tabs
    const splitEmails = rawEmails.split(/[\n,;\t\s]+/)
    const validEmails: string[] = []
    const invalidEmails: string[] = []

    for (const raw of splitEmails) {
      const email = raw.trim().toLowerCase()
      if (!email) continue
      if (emailRegex.test(email)) {
        validEmails.push(email)
      } else {
        invalidEmails.push(raw)
      }
    }

    if (validEmails.length === 0) {
      return NextResponse.json({ error: "No valid email addresses found to pre-approve." }, { status: 400 })
    }

    // Remove duplicates from the parsed list
    const uniqueValid = Array.from(new Set(validEmails))

    // Check which emails are already registered as actual accounts
    const existingAccounts = await prisma.user.findMany({
      where: { email: { in: uniqueValid } },
      select: { email: true },
    })
    const existingEmails = new Set(existingAccounts.map((u) => u.email.toLowerCase()))

    // Filter out emails that already have accounts
    const finalEmailsToInsert = uniqueValid.filter((email) => !existingEmails.has(email))

    if (finalEmailsToInsert.length === 0) {
      return NextResponse.json({
        message: "All valid emails already have active user accounts.",
        addedCount: 0,
        skippedCount: uniqueValid.length - finalEmailsToInsert.length,
      })
    }

    // Insert into PreApprovedEmail list
    const insertData = finalEmailsToInsert.map((email) => ({
      email,
      role: targetRole,
    }))

    const result = await prisma.preApprovedEmail.createMany({
      data: insertData,
      skipDuplicates: true, // skip duplicates within the whitelist
    })

    return NextResponse.json({
      message: `Pre-approved ${result.count} email(s) successfully.`,
      addedCount: result.count,
      skippedCount: uniqueValid.length - result.count,
      invalidEmails: invalidEmails.length > 0 ? invalidEmails : undefined,
    })
  } catch (error) {
    console.error("[POST /api/admin/pre-approved-emails]", error)
    return NextResponse.json({ error: "Failed to add pre-approved emails" }, { status: 500 })
  }
}

// DELETE /api/admin/pre-approved-emails — Delete pre-approved email entries
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "Missing pre-approval entry id" }, { status: 400 })

    await prisma.preApprovedEmail.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Pre-approved email removed" })
  } catch (error) {
    console.error("[DELETE /api/admin/pre-approved-emails]", error)
    return NextResponse.json({ error: "Failed to remove pre-approved email" }, { status: 500 })
  }
}
