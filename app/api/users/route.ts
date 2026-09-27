import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

import bcrypt from "bcryptjs"

const userRoleEnum = z.enum(["ADMIN", "INSTRUCTOR", "LEARNER", "PROCTOR"])

const createUserSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  password: z.string().min(6).max(128).optional(),
  role: userRoleEnum.optional().default("LEARNER"),
}).strict()

const singleUpdateSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  role: userRoleEnum.optional(),
}).strict()

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  isActive: z.boolean().optional(),
  role: userRoleEnum.optional(),
}).strict()

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
}).strict()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""
    const rawRole = searchParams.get("role") || "ALL"
    const role = rawRole.toUpperCase()

    // Ensure at least one default learner exists if none are in DB
    const existingLearnersCount = await prisma.user.count({ where: { role: "LEARNER" } })
    if (existingLearnersCount === 0) {
      try {
        const hashedPassword = await bcrypt.hash("cpace1234", 12)
        await prisma.user.upsert({
          where: { email: "learner@cpace.ph" },
          update: { role: "LEARNER", isActive: true },
          create: {
            email: "learner@cpace.ph",
            password: hashedPassword,
            firstName: "Juan",
            lastName: "Dela Cruz",
            role: "LEARNER",
            isActive: true,
          },
        })
      } catch (err) {
        console.error("Auto-seed learner fallback error:", err)
      }
    }

    const where: any = {}
    if (role !== "ALL") {
      where.role = role
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [users, total, adminCount, instructorCount, proctorCount, learnerCount, dbTotal] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      prisma.user.count({ where: { role: "PROCTOR" } }),
      prisma.user.count({ where: { role: "LEARNER" } }),
      prisma.user.count(),
    ])
    return NextResponse.json({
      data: users,
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        total: dbTotal,
        admin: adminCount,
        instructor: instructorCount,
        proctor: proctorCount,
        learner: learnerCount,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const caller = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { email, firstName, lastName, password, role } = createUserSchema.parse(body)

    // Instructors can only create LEARNER accounts
    const targetRole = caller.role === "ADMIN" ? (role || "LEARNER") : "LEARNER"
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "A user with this email address already exists" }, { status: 400 })
    }

    const rawPassword = password && password.trim() ? password.trim() : "cpace1234"
    const hashedPassword = await bcrypt.hash(rawPassword, 12)

    // Auto-approve email in whitelist so registration/login succeeds smoothly
    await prisma.preApprovedEmail.upsert({
      where: { email: normalizedEmail },
      update: { role: targetRole },
      create: { email: normalizedEmail, role: targetRole },
    }).catch(() => {})

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: hashedPassword,
        role: targetRole,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: newUser, data: newUser, success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid user data provided" }, { status: 400 })
    console.error("[POST /api/users]", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()

    // Bulk update: { ids: string[], isActive?: boolean, role?: string }
    if (Array.isArray(body.ids)) {
      const { ids, isActive, role } = bulkUpdateSchema.parse(body)
      // Prevent admin from deactivating/changing their own account in bulk
      const safeIds = ids.filter((id: string) => id !== admin.id)
      await prisma.user.updateMany({
        where: { id: { in: safeIds } },
        data: { ...(isActive !== undefined && { isActive }), ...(role && { role }) },
      })
      return NextResponse.json({ updated: safeIds.length })
    }

    // Single update: { id, isActive?, role? }
    const { id, isActive, role } = singleUpdateSchema.parse(body)
    const updated = await prisma.user.update({
      where: { id },
      data: { ...(isActive !== undefined && { isActive }), ...(role && { role }) },
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { ids } = bulkDeleteSchema.parse(await request.json())

    // Prevent admin from deleting their own account
    const safeIds = ids.filter((id: string) => id !== admin.id)
    await prisma.user.deleteMany({ where: { id: { in: safeIds } } })
    return NextResponse.json({ deleted: safeIds.length })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    return NextResponse.json({ error: "Failed to delete users" }, { status: 500 })
  }
}
