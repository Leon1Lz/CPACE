import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type CalendarItem = {
  id: string
  title: string
  subtitle: string
  date: string
  endDate?: string | null
  type: "TRAINING" | "ASSESSMENT_OPEN" | "ASSESSMENT_CLOSE" | "SCORE_RELEASE"
  href: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    let assessmentWhere: Prisma.AssessmentWhereInput = {}
    if (user.role === "INSTRUCTOR") assessmentWhere = { course: { instructorId: user.id } }
    if (user.role === "LEARNER") assessmentWhere = { isPublished: true, course: { enrollments: { some: { userId: user.id } } } }
    if (user.role === "PROCTOR") assessmentWhere = { course: { proctorAssignments: { some: { proctorId: user.id } } } }

    const [assessments, trainingEvents] = await Promise.all([
      prisma.assessment.findMany({
        where: assessmentWhere,
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          scoresReleasedAt: true,
          course: { select: { title: true } },
          results: user.role === "LEARNER" ? { where: { userId: user.id }, select: { id: true }, take: 1 } : false,
        },
      }),
      prisma.trainingEvent.findMany({
        where: user.role === "ADMIN" ? undefined : { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
      }),
    ])

    const items: CalendarItem[] = trainingEvents.map(event => ({
      id: `training-${event.id}`,
      title: event.title,
      subtitle: `${event.certification} · ${event.location}`,
      date: `${event.startDate}T12:00:00.000Z`,
      endDate: event.endDate ? `${event.endDate}T12:00:00.000Z` : null,
      type: "TRAINING",
      href: user.role === "ADMIN" ? "/dashboard/schedules" : event.registrationUrl,
    }))

    for (const assessment of assessments) {
      const href = user.role === "LEARNER" ? `/dashboard/assessments/${assessment.id}/take` : `/dashboard/assessments/${assessment.id}/manage`
      const subtitle = assessment.course.title
      if (assessment.startsAt) items.push({ id: `assessment-open-${assessment.id}`, title: `${assessment.title} opens`, subtitle, date: assessment.startsAt.toISOString(), type: "ASSESSMENT_OPEN", href })
      if (assessment.endsAt) items.push({ id: `assessment-close-${assessment.id}`, title: `${assessment.title} closes`, subtitle, date: assessment.endsAt.toISOString(), type: "ASSESSMENT_CLOSE", href })
      const learnerHasResult = user.role !== "LEARNER" || (Array.isArray(assessment.results) && assessment.results.length > 0)
      if (assessment.scoresReleasedAt && learnerHasResult) items.push({ id: `score-release-${assessment.id}`, title: `${assessment.title} results`, subtitle, date: assessment.scoresReleasedAt.toISOString(), type: "SCORE_RELEASE", href: user.role === "LEARNER" ? "/dashboard/reports" : href })
    }

    items.sort((left, right) => left.date.localeCompare(right.date))
    return NextResponse.json({ today: new Date().toISOString(), items })
  } catch (error) {
    console.error("Calendar GET error:", error)
    return NextResponse.json({ error: "Failed to load calendar" }, { status: 500 })
  }
}
