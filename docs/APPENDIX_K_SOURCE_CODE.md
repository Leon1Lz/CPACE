# Appendix K: Source Code

**CPACE Learning Portal**

This appendix presents selected source-code listings from the CPACE Learning Portal. The listings preserve the source text and indentation. Partial excerpts depend on their surrounding application code and are identified in the accompanying descriptions.

Source snapshot: October 19, 2026 (Asia/Singapore). Repository revision: f988f1c0d279.

## List of Listings

- K.1 User authentication
- K.2 Role and resource authorization
- K.3 Learning-path prerequisites
- K.4 Server-enforced exam timing
- K.5 Assessment answer autosave
- K.6 Automatic assessment scoring
- K.7 Manual grading
- K.8 Assigned proctor access
- K.9 Live proctoring snapshots and device health
- K.10 Certificate issuance after a final examination
- K.11 Certificate verification URL and QR code
- K.12 Certificate description and validity
- K.13 Public certificate lookup
- K.14 Description and QR code on the PDF certificate
- K.15 Certificate database model

## K.1 User authentication

This credentials-provider excerpt normalizes the email, checks the active account and password hash, and records a new active-session token.

Source: `lib/auth.ts`, lines 15-62.

```ts
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const normalizedEmail = credentials.email.trim().toLowerCase()

      if (!prisma) {
        console.error('Prisma client not available for authentication')
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail
        }
      })

      if (!user || !user.isActive) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      )

      if (!isPasswordValid) {
        return null
      }

      // Generate a new unique session token
      const sessionToken = crypto.randomUUID()

      // Update the user's active session token in the database
      await prisma.user.update({
        where: { id: user.id },
        data: { activeSessionToken: sessionToken }
      })

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        sessionToken,
      }
    }
```

## K.2 Role and resource authorization

These authorization helpers allow administrators to manage resources and restrict instructors to the relevant owned or assigned resources. Remaining group and image helpers are omitted.

Source: `lib/authorization.ts`, lines 1-33.

```ts
import { prisma } from "@/lib/prisma"

export type AuthorizedUser = {
  id: string
  role: string
}

export function canManageOwnedResource(
  user: AuthorizedUser,
  ownerId: string | null | undefined,
) {
  return user.role === "ADMIN" || (user.role === "INSTRUCTOR" && ownerId === user.id)
}

export async function canManageCourse(user: AuthorizedUser, courseId: string) {
  if (user.role === "ADMIN") return true
  if (user.role !== "INSTRUCTOR") return false
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, creatorId: true },
  })
  return course?.instructorId === user.id || course?.creatorId === user.id
}

export async function canManageAssessment(user: AuthorizedUser, assessmentId: string) {
  if (user.role === "ADMIN") return true
  if (user.role !== "INSTRUCTOR") return false
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { course: { select: { instructorId: true } } },
  })
  return assessment?.course.instructorId === user.id
}
```

## K.3 Learning-path prerequisites

This complete module finds published learning paths assigned to a learner's groups and evaluates progress before allowing access to a course or assessment.

Source: `lib/learning-path-access.ts`, lines 1-29.

```ts
import { prisma } from "@/lib/prisma"
import { evaluatePathSteps, findLearningPathBlocker, type PathTarget } from "@/lib/learning-path-progress"

export async function getLearningPathBlocker(userId: string, target: PathTarget) {
  const paths = await prisma.learningPath.findMany({
    where: {
      isPublished: true,
      groups: { some: { group: { members: { some: { userId } } } } },
      steps: { some: { OR: [
        { type: "COURSE", courseId: target.courseId },
        ...(target.assessmentId ? [{ type: "ASSESSMENT" as const, assessmentId: target.assessmentId }] : []),
      ] } },
    },
    select: {
      id: true, title: true,
      steps: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: { course: { select: { title: true } }, assessment: { select: { title: true } } },
      },
    },
    orderBy: { id: "asc" },
  })
  if (!paths.length) return null
  const [enrollments, results] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true, status: true, progress: true } }),
    prisma.assessmentResult.findMany({ where: { userId, completedAt: { not: null }, gradedAt: { not: null } }, select: { assessmentId: true, passed: true, score: true } }),
  ])
  return findLearningPathBlocker(paths.map(path => ({ ...path, steps: evaluatePathSteps(path.steps, enrollments, results) })), target)
}
```

## K.4 Server-enforced exam timing

This complete module computes exam deadlines and selects previously saved answers when a submission arrives after the deadline.

Source: `lib/assessment-timing.ts`, lines 1-22.

```ts
export function examDeadline(startedAt: Date, timeLimit?: number | null) {
  return timeLimit ? new Date(startedAt.getTime() + timeLimit * 60000) : null
}

export function examExpired(deadlineAt?: Date | null, now = new Date()) {
  return Boolean(deadlineAt && now >= deadlineAt)
}

export type SubmittedAnswer = { questionId: string; selectedOptionId?: string; content?: string }

// Only server-persisted answers may be graded once the attempt's deadline passes.
export function submissionAnswers(answers: SubmittedAnswer[], draft: unknown, expired: boolean): SubmittedAnswer[] {
  if (!expired) return answers
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return []
  return Object.entries(draft).map(([questionId, value]) => {
    const answer = value && typeof value === "object" ? value as Record<string, unknown> : {}
    return { questionId,
      ...(typeof answer.selectedOptionId === "string" ? { selectedOptionId: answer.selectedOptionId } : {}),
      ...(typeof answer.content === "string" ? { content: answer.content } : {}),
    }
  })
}
```

## K.5 Assessment answer autosave

This complete API route validates enrollment, prerequisites, questions and options, then saves versioned answers inside a transaction while checking the active session and deadline.

Source: `app/api/assessments/[id]/draft/route.ts`, lines 1-67.

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLearningPathBlocker } from "@/lib/learning-path-access"
import { z } from "zod"
import { examExpired } from "@/lib/assessment-timing"
import { AssessmentIntegrityError } from "@/lib/assessment-integrity"

const draftSchema = z.object({
  sessionId: z.string().min(1).max(100),
  version: z.number().int().min(0),
  answers: z.record(z.string().min(1).max(100), z.object({
    selectedOptionId: z.string().min(1).max(100).optional(),
    content: z.string().max(10000).optional(),
  }).strict()).refine(value => Object.keys(value).length <= 500),
}).strict()

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getServerSession(authOptions)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!user || user.role !== "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id } = await params
    const body = draftSchema.parse(await request.json())
    const assessment = await prisma.assessment.findUnique({ where: { id },
      include: { questions: { select: { id: true, options: { select: { id: true } } } } } })
    if (!assessment?.isPublished) return NextResponse.json({ error: "Assessment unavailable" }, { status: 403 })
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: assessment.courseId } } })
    if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status))
      return NextResponse.json({ error: "Enrollment required" }, { status: 403 })
    const blocker = await getLearningPathBlocker(user.id, { courseId: assessment.courseId, assessmentId: id })
    if (blocker) return NextResponse.json(blocker, { status: 403 })
    for (const [questionId, answer] of Object.entries(body.answers)) {
      const question = assessment.questions.find(q => q.id === questionId)
      if (!question || (answer.selectedOptionId && !question.options.some(o => o.id === answer.selectedOptionId)))
        return NextResponse.json({ error: "Invalid question or option" }, { status: 400 })
    }
    await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "exam_sessions" WHERE "id" = ${body.sessionId} AND "userId" = ${user.id} AND "assessmentId" = ${id} FOR UPDATE`
    const existing = await tx.examSession.findFirst({ where: {
      id: body.sessionId, userId: user.id, assessmentId: id, status: "IN_PROGRESS",
    }, select: { draftAnswers: true, draftVersion: true, deadlineAt: true } })
    if (!existing) throw new AssessmentIntegrityError("Attempt changed or was submitted. Please review your saved attempt.")
    const normalized = (value: unknown) => JSON.stringify(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b)).map(([key, answer]) => [key, Object.entries(answer as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))]))
    // An identical retry acknowledges a pre-deadline save without another write.
    if (existing.draftVersion === body.version + 1 && normalized(existing.draftAnswers) === normalized(body.answers)) return
    if (examExpired(existing.deadlineAt)) throw new AssessmentIntegrityError("Exam time has ended. Submit to recover the last answers saved before the deadline.")
    if (existing.draftVersion !== body.version) throw new AssessmentIntegrityError("Attempt changed or was submitted. Keep this page open and review the saved copy before reloading.")
    const saved = await tx.examSession.updateMany({
      where: { id: body.sessionId, userId: user.id, assessmentId: id, status: "IN_PROGRESS", draftVersion: body.version },
      data: { draftAnswers: body.answers, draftVersion: { increment: 1 } },
    })
    if (saved.count !== 1) throw new AssessmentIntegrityError("Attempt changed. Please retry or review your saved attempt.")
    })
    return NextResponse.json({ version: body.version + 1 }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof AssessmentIntegrityError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 })
    console.error("Draft save error:", error)
    return NextResponse.json({ error: "Answers could not be saved" }, { status: 500 })
  }
}
```

## K.6 Automatic assessment scoring

This submission-handler excerpt scores objective answers and retains written responses for manual review. Surrounding authorization, persistence and response code are omitted.

Source: `app/api/assessments/[id]/submit/route.ts`, lines 139-183.

```ts
    // Score the answers
    const acceptedAnswers = submissionAnswers(answers, examSession?.draftAnswers, timedOut)
    let totalPoints = 0
    let earnedPoints = 0
    const scoredAnswers: { questionId: string; content: string; isCorrect: boolean; points: number }[] = []

    for (const question of assessment.questions) {
      totalPoints += question.points
      const userAnswer = acceptedAnswers.find(a => a.questionId === question.id)
      if (!userAnswer) {
        scoredAnswers.push({ questionId: question.id, content: "", isCorrect: false, points: 0 })
        continue
      }

      let isCorrect = false
      let pointsEarned = 0
      let answerContent = userAnswer.content ?? ""

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        const selectedOption = question.options.find(o => o.id === userAnswer.selectedOptionId)
        isCorrect = selectedOption?.isCorrect ?? false
        answerContent = selectedOption?.text ?? ""
        pointsEarned = isCorrect ? question.points : 0
      } else if (question.type === "SHORT_ANSWER" || question.type === "ESSAY") {
        // Open-ended: store the content, mark for manual review (isCorrect = false until reviewed)
        answerContent = userAnswer.content ?? ""
        isCorrect = false
        pointsEarned = 0
      }

      earnedPoints += pointsEarned
      scoredAnswers.push({ questionId: question.id, content: answerContent, isCorrect, points: pointsEarned })
    }

    // Check if any open-ended questions exist (they are manually reviewed)
    const hasOpenEnded = assessment.questions.some(
      q => q.type === "SHORT_ANSWER" || q.type === "ESSAY"
    )
    // For scoring purposes, only auto-scored questions count toward total when open-ended exist
    const autoScoredTotal = assessment.questions
      .filter(q => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE")
      .reduce((sum, q) => sum + q.points, 0)
    const scoreBase = hasOpenEnded ? (autoScoredTotal > 0 ? autoScoredTotal : totalPoints) : totalPoints
    const score = scoreBase > 0 ? (earnedPoints / scoreBase) * 100 : 0
    const passed = !hasOpenEnded && score >= assessment.passingScore
```

## K.7 Manual grading

This complete module validates submitted marks and computes the final score after written answers have been graded.

Source: `lib/manual-grading.ts`, lines 1-23.

```ts
import { z } from "zod"

export const gradeSchema = z.object({ answers: z.array(z.object({
  answerId: z.string().min(1).max(100),
  points: z.number().finite().min(0),
  feedback: z.string().trim().max(2000).default(""),
}).strict()).min(1).max(500) }).strict()

export const isWrittenQuestion = (type: string) => type === "SHORT_ANSWER" || type === "ESSAY"

export function calculateFinalGrade(answers: { id: string; points: number; question: { type: string; points: number } }[], marks: z.infer<typeof gradeSchema>["answers"], passingScore: number) {
  const written = answers.filter(answer => isWrittenQuestion(answer.question.type))
  if (marks.length !== written.length || new Set(marks.map(mark => mark.answerId)).size !== marks.length)
    throw new Error("Grade every written answer exactly once.")
  for (const mark of marks) {
    const answer = written.find(answer => answer.id === mark.answerId)
    if (!answer || mark.points > answer.question.points) throw new Error("Points must not exceed the question maximum; only written answers can be graded.")
  }
  const total = answers.reduce((sum, answer) => sum + answer.question.points, 0)
  const earned = answers.reduce((sum, answer) => sum + (isWrittenQuestion(answer.question.type) ? marks.find(mark => mark.answerId === answer.id)!.points : answer.points), 0)
  const score = total > 0 ? earned / total * 100 : 0
  return { score, passed: score >= passingScore, earned, total }
}
```

## K.8 Assigned proctor access

This module excerpt scopes exam sessions by assigned course and optional group. Learners can access their own sessions, while other viewers are checked against their scope. Notification helpers are omitted.

Source: `lib/proctor-access.ts`, lines 1-26.

```ts
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { AuthorizedUser } from "@/lib/authorization"

export type ProctorScope = { courseId: string; groupId: string | null }

export function buildProctorSessionScope(assignments: ProctorScope[]): Prisma.ExamSessionWhereInput {
  if (!assignments.length) return { id: { in: [] } }
  return { OR: assignments.map(assignment => ({
    assessment: { courseId: assignment.courseId },
    ...(assignment.groupId ? { user: { groupMemberships: { some: { groupId: assignment.groupId } } } } : {}),
  })) }
}

export async function getProctorSessionScope(user: AuthorizedUser): Promise<Prisma.ExamSessionWhereInput> {
  if (user.role === "ADMIN") return {}
  if (user.role !== "PROCTOR") return { id: { in: [] } }
  return buildProctorSessionScope(await prisma.proctorAssignment.findMany({
    where: { proctorId: user.id }, select: { courseId: true, groupId: true },
  }))
}

export async function canAccessExamSession(user: AuthorizedUser, sessionId: string) {
  const scope = user.role === "LEARNER" ? { userId: user.id } : await getProctorSessionScope(user)
  return Boolean(await prisma.examSession.findFirst({ where: { AND: [{ id: sessionId }, scope] }, select: { id: true } }))
}
```

## K.9 Live proctoring snapshots and device health

This complete API route validates camera-frame size and image content, updates the learner's active-session heartbeat, and publishes an accepted snapshot. It handles snapshots and device health; the full video-transport implementation is separate.

Source: `app/api/assessments/[id]/session/feed/route.ts`, lines 1-62.

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { triggerEvent } from "@/lib/pusher"
import { setLiveSnapshot } from "@/lib/exam-live-store"
import { isSafeImageDataUrl } from "@/lib/authorization"
import { MAX_LIVE_SNAPSHOT_BYTES } from "@/lib/exam-live-snapshot"

const feedSchema = z.object({
  sessionId: z.string().min(1).max(100),
  snapshot: z.string().optional(),
  cameraStatus: z.enum(["CONNECTED", "DISCONNECTED", "STARTING", "ERROR"]).default("CONNECTED"),
  detectorStatus: z.enum(["ACTIVE", "STARTING", "LOADING", "ERROR", "DISABLED"]).default("ACTIVE"),
}).strict()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const { id: assessmentId } = await params
    const { sessionId, snapshot, cameraStatus, detectorStatus } = feedSchema.parse(await request.json())

    if (snapshot !== undefined) {
      // Size and content failures are distinct; tiny live JPEGs are legitimate.
      const encoded = /^data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(snapshot)?.[1]
      const padding = encoded?.endsWith("==") ? 2 : encoded?.endsWith("=") ? 1 : 0
      const bytes = encoded ? Math.floor(encoded.length * 3 / 4) - padding : 0
      if (snapshot.length > Math.ceil(MAX_LIVE_SNAPSHOT_BYTES / 3) * 4 + 23 || bytes > MAX_LIVE_SNAPSHOT_BYTES) {
        return NextResponse.json({ error: "Snapshot exceeds the 512 KB limit" }, { status: 413 })
      }
      if (!isSafeImageDataUrl(snapshot, MAX_LIVE_SNAPSHOT_BYTES, 64)) {
        return NextResponse.json({ error: "Snapshot must contain a valid JPEG or PNG frame" }, { status: 400 })
      }
    }
    if (cameraStatus === "CONNECTED" && !snapshot) {
      return NextResponse.json({ error: "A connected camera must include a video frame" }, { status: 400 })
    }

    // Health-only heartbeats report disconnected/loading devices without fabricating a frame.
    const updated = await prisma.examSession.updateMany({
      where: { id: sessionId, userId: user.id, assessmentId, status: "IN_PROGRESS" },
      data: { lastHeartbeatAt: new Date(), cameraStatus, detectorStatus },
    })
    if (updated.count !== 1) return NextResponse.json({ error: "Invalid active session" }, { status: 403 })

    if (snapshot && cameraStatus === "CONNECTED") {
      setLiveSnapshot(sessionId, snapshot)
      await triggerEvent("private-exam-session-" + sessionId, "webcam-snapshot", { snapshot })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid live feed request" }, { status: 400 })
    }
    console.error("Live feed heartbeat failed")
    return NextResponse.json({ error: "Failed to update live feed" }, { status: 500 })
  }
}
```

## K.10 Certificate issuance after a final examination

This submission-handler excerpt creates a certificate with its description when a released final-examination result is passing and no certificate already exists for that learner and course. The enclosing handler and following notification code are omitted; the excerpt ends inside its conditional block.

Source: `app/api/assessments/[id]/submit/route.ts`, lines 263-279.

```ts
    // Auto-issue certificate if FINAL_EXAM and passed (only when released!)
    let certificate = null
    if (released && assessment.type === "FINAL_EXAM" && passed) {
      const existing = await prisma.certificate.findFirst({
        where: { userId: user.id, courseId: assessment.courseId },
      })
      if (!existing) {
        const certNumber = `CPACE-${Date.now()}-${user.id.slice(-4).toUpperCase()}`
        certificate = await prisma.certificate.create({
          data: {
            title: `Certificate of Completion — ${assessment.course.title}`,
            description: `Successfully completed the final examination for ${assessment.course.title}`,
            certificateNumber: certNumber,
            userId: user.id,
            courseId: assessment.courseId,
          },
        })
```

## K.11 Certificate verification URL and QR code

This complete module constructs the public verification URL and generates a PNG QR code locally from that URL.

Source: `lib/certificate-qr.ts`, lines 1-21.

```ts
import QRCode from "qrcode"

export async function createCertificateVerification(certificateNumber: string) {
  const baseUrl = process.env.NEXTAUTH_URL?.trim()
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
    || "https://cpace-three.vercel.app"
  const origin = new URL(baseUrl)
  if (origin.protocol !== "https:" && origin.protocol !== "http:") {
    throw new Error("Certificate verification requires an HTTP or HTTPS site URL")
  }
  const verificationUrl = new URL(`/verify/${encodeURIComponent(certificateNumber)}`, origin.origin).href
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    type: "image/png",
    errorCorrectionLevel: "M",
    margin: 4,
    width: 360,
    color: { dark: "#000000", light: "#ffffff" },
  })

  return { verificationUrl, qrCodeDataUrl }
}
```

## K.12 Certificate description and validity

These complete helper functions supply a default description and distinguish valid, expired and revoked certificates.

Source: `lib/certificates.ts`, lines 1-12.

```ts
export function getCertificateDescription(description?: string | null): string {
  return description?.trim() || "Awarded in recognition of successful completion of the course requirements."
}

export function getCertificateStatus(
  certificate: { isValid: boolean; expiresAt?: Date | string | null },
  now = new Date(),
): "valid" | "expired" | "revoked" {
  if (!certificate.isValid) return "revoked"
  if (certificate.expiresAt && new Date(certificate.expiresAt) <= now) return "expired"
  return "valid"
}
```

## K.13 Public certificate lookup

This verification-page excerpt retrieves the certificate and its associated learner and course, then determines its current status. Imports, the surrounding component declaration and the rendered interface are omitted.

Source: `app/(landing)/verify/[certificateNumber]/page.tsx`, lines 15-38.

```tsx
  const { certificateNumber } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
          category: true,
        },
      },
    },
  })
  const badgeUrl = cert ? getCourseBadgeUrl(cert.course.title, cert.course.category) : null
  const status = cert ? getCertificateStatus(cert) : null
  const isActive = status === "valid"
  const StatusIcon = isActive ? CheckCircle : XCircle
```

## K.14 Description and QR code on the PDF certificate

These three separate PDF-component excerpts show the input properties, certificate description and clickable QR code. Each block preserves its original source text; omitted layout and styling remain in the source file.

Source: `components/pdf/certificate-document.tsx`, lines 326-335.

```tsx
export function CertificateDocument({ cert, verificationUrl, qrCodeDataUrl }: {
  cert: Cert
  verificationUrl: string
  qrCodeDataUrl: string
}) {
  const fullName = `${cert.user.firstName} ${cert.user.lastName}`.trim()
  const issueDate = new Date(cert.issuedAt).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  })
  const description = getCertificateDescription(cert.description)
```

Source: `components/pdf/certificate-document.tsx`, lines 377-380.

```tsx
          <Text style={styles.bodyText}>for successfully completing the course</Text>
          <Text style={styles.courseTitle}>{cert.course.title}</Text>
          {cert.course.category ? <Text style={styles.category}>{cert.course.category}</Text> : null}
          <Text style={styles.description}>{description}</Text>
```

Source: `components/pdf/certificate-document.tsx`, lines 406-411.

```tsx
            <View style={styles.qrBlock}>
              <Link src={verificationUrl}>
                <Image src={qrCodeDataUrl} style={styles.qrCode} />
              </Link>
              <Text style={styles.qrCaption}>Scan to verify certificate</Text>
            </View>
```

## K.15 Certificate database model

This Prisma model stores the certificate number, description, dates, validity flag, and relationships to its learner and course.

Source: `prisma/schema.prisma`, lines 476-495.

```prisma
model Certificate {
  id                String    @id @default(cuid())
  title             String
  description       String?
  certificateNumber String @unique
  issuedAt          DateTime  @default(now())
  expiresAt         DateTime?
  fileUrl           String?   // PDF file URL
  isValid           Boolean   @default(true)
  createdAt         DateTime  @default(now())

  // Relations
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  courseId    String
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@map("certificates")
}
```
