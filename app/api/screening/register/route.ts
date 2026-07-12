import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const screeningSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  screeningAnswers: z.record(z.string()), // { "q1": "CFMS", "q2": "marketing" }
})

// Determine which courses match based on screening answers
function determineMatchedCourses(answers: Record<string, string>): string[] {
  const courses: string[] = []
  const answerValues = Object.values(answers).map(v => v.toLowerCase())
  
  // Example logic - customize based on your actual screening questions
  if (answerValues.some(v => v.includes("cfms"))) courses.push("cfms-basics")
  if (answerValues.some(v => v.includes("cmms"))) courses.push("cmms-basics")
  if (answerValues.some(v => v.includes("marketing"))) courses.push("marketing-101")
  if (answerValues.some(v => v.includes("finance"))) courses.push("finance-101")
  if (answerValues.some(v => v.includes("advanced"))) courses.push("advanced-cpace")
  
  return courses
}

// Generate magic link token
function generateMagicToken(): string {
  return Buffer.from(Math.random().toString()).toString('base64').slice(0, 32)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, screeningAnswers } = screeningSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please login." },
        { status: 400 }
      )
    }

    // Generate temp password and magic token
    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    const magicToken = generateMagicToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: "LEARNER",
        // Could store screening answers in a separate table if needed
      },
    })

    // Determine matched courses from screening
    const matchedCourseIds = determineMatchedCourses(screeningAnswers)

    // Find or create a cohort group for this batch
    const currentYear = new Date().getFullYear()
    const groupName = `Batch ${currentYear} - ${new Date().toLocaleString('default', { month: 'short' })}`
    
    let group = await prisma.group.findFirst({
      where: { name: groupName },
    })

    if (!group) {
      // Get admin as creator
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
      if (!admin) {
        return NextResponse.json({ error: "System not configured - no admin found" }, { status: 500 })
      }
      
      group = await prisma.group.create({
        data: {
          name: groupName,
          description: `Auto-created cohort for ${currentYear} screenings`,
          creatorId: admin.id,
        },
      })
    }

    // Add user to group
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: user.id },
    })

    // Assign matched courses to the group (if not already assigned)
    if (matchedCourseIds.length > 0) {
      // Get actual course IDs from your database based on matching logic
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            { category: { in: matchedCourseIds.map(id => id.toUpperCase()) } },
            { title: { contains: matchedCourseIds[0].split('-')[0], mode: 'insensitive' } },
          ],
          status: "PUBLISHED",
        },
        select: { id: true },
      })

      if (courses.length > 0) {
        // Assign courses to group
        await prisma.groupCourse.createMany({
          data: courses.map(c => ({ groupId: group!.id, courseId: c.id })),
          skipDuplicates: true,
        })

        // Auto-enroll user in all group courses
        await prisma.enrollment.createMany({
          data: courses.map(c => ({ userId: user.id, courseId: c.id })),
          skipDuplicates: true,
        })
      }
    }

    // TODO: Send magic link email here
    // await sendMagicLinkEmail(email, magicToken)
    console.log(`[SCREENING] Magic link for ${email}: /login?token=${magicToken}`)

    return NextResponse.json({
      success: true,
      message: "Registration successful! Check your email for login instructions.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      assignedCourses: matchedCourseIds.length,
      groupName: group.name,
    })

  } catch (error) {
    console.error("[SCREENING REGISTER]", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process registration" },
      { status: 500 }
    )
  }
}
