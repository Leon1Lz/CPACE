// Live browser journey with isolated fixtures. Run: node --import tsx scripts/check-final-exam-flow.mjs
// Requires playwright-core installed in %TEMP%/cpace-flow-test-tools; uses installed Chrome.
import envLoader from '@next/env'
import bcrypt from 'bcryptjs'
import { randomUUID, randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('../', import.meta.url))
envLoader.loadEnvConfig(root)
assert(process.env.DATABASE_URL, 'Explicit database configuration is required; do not use a fallback')
const { prisma } = await import('../lib/prisma.ts')
const { chromium } = await import(pathToFileURL(path.join(os.tmpdir(), 'cpace-flow-test-tools/node_modules/playwright-core/index.mjs')).href)
const base = 'https://cpace-three.vercel.app'
const tag = `e2e-flow-${randomUUID()}`
const ownerId = `${tag}-owner`
const learnerId = `${tag}-learner`
const courseId = `${tag}-course`
const assessmentId = `${tag}-exam`
const email = `${tag}@example.invalid`
const password = randomBytes(30).toString('base64url')
const courseTitle = `[TEST ONLY] Certificate flow ${tag.slice(-8)}`
const examTitle = `[TEST ONLY] Passing grade 70 percent ${tag.slice(-8)}`
const folder = path.join(root, '.local/stress-test', tag)
await mkdir(folder, { recursive: true })
await writeFile(path.join(folder, 'cleanup.json'), JSON.stringify({ tag, ownerId, learnerId, courseId, assessmentId }, null, 2))
const checks = []
let browser
let context
let page
let stage = 'fixture setup'
let result
let cleanupCompleted = false
let errorSummary

function passed(name, details = {}) {
  checks.push({ name, passed: true, ...details })
  console.log(JSON.stringify({ check: name, passed: true, ...details }))
}

async function jsonResponse(response, label) {
  assert(response.ok(), `${label}: HTTP ${response.status()}`)
  return response.json()
}

try {
  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.$transaction(async tx => {
    await tx.user.create({ data: { id: ownerId, email: `${tag}-owner@example.invalid`, password: hashedPassword,
      firstName: 'Automated', lastName: 'Test Instructor', role: 'INSTRUCTOR' } })
    await tx.user.create({ data: { id: learnerId, email, password: hashedPassword,
      firstName: 'Automated', lastName: 'Test Learner', role: 'LEARNER' } })
    await tx.course.create({ data: { id: courseId, title: courseTitle, status: 'DRAFT', creatorId: ownerId,
      instructorId: ownerId, learningObjectives: ['Isolated automated passing-grade test; not a real course.'] } })
    await tx.enrollment.create({ data: { userId: learnerId, courseId, status: 'ACTIVE', progress: 0, completedModules: [] } })
    await tx.assessment.create({ data: { id: assessmentId, title: examTitle, courseId, type: 'FINAL_EXAM',
      timeLimit: 15, passingScore: 70, attempts: 1, isPublished: true, releaseScores: true,
      motionDetectionEnabled: false, evidenceCaptureEnabled: false, requireProctoringConsent: true,
      questions: { create: Array.from({ length: 10 }, (_, index) => ({
        question: `TEST ONLY question ${index + 1}: choose an option.`, order: index, points: 1, type: 'MULTIPLE_CHOICE',
        options: { create: [{ text: 'Expected option', isCorrect: true, order: 0 }, { text: 'Alternative option', isCorrect: false, order: 1 }] },
      })) } } })
  })
  passed('Isolated learner, draft course, enrollment and ten-question final exam created')

  stage = 'browser login'
  browser = await chromium.launch({ channel: 'chrome', headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
  context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 }, permissions: ['camera'] })
  context.setDefaultTimeout(30000)
  const csrf = await jsonResponse(await context.request.get('/api/auth/csrf'), 'CSRF preflight')
  const login = await context.request.post('/api/auth/callback/credentials', { form: {
    email, password, csrfToken: csrf.csrfToken, callbackUrl: `${base}/dashboard`, json: 'true',
  }, maxRedirects: 0 })
  assert([200, 302].includes(login.status()), `Credentials login: HTTP ${login.status()}`)
  const session = await jsonResponse(await context.request.get('/api/auth/session'), 'Session')
  assert.equal(session.user?.id, learnerId, 'Normal credentials login must authenticate only the test learner')
  passed('Live normal credentials login confirmed as test learner')

  stage = 'camera check and identity snapshots'
  page = await context.newPage()
  await page.goto(`${base}/dashboard/assessments/${assessmentId}/take`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Run Camera Check', exact: true }).click()
  await page.getByText('Camera and lighting check passed.', { exact: false }).waitFor()
  await page.getByRole('button', { name: /Capture Face Snapshot/ }).click()
  await page.getByRole('button', { name: /Capture ID Card Snap/ }).click()
  await page.getByRole('checkbox').check()
  passed('Real exam page accepted synthetic camera, snapshots, calibration and consent', { motionAnalysis: 'Disabled on this test exam' })

  stage = 'exam start'
  const startResponse = page.waitForResponse(response => response.url().endsWith(`/api/assessments/${assessmentId}/session`) && response.request().method() === 'POST')
  await page.getByRole('button', { name: /Start Final Exam|Start Exam|Begin Exam|Begin Final Exam/, exact: false }).click()
  const started = await jsonResponse(await startResponse, 'Start final exam')
  assert(started.sessionId, 'Server must create a timed exam session')
  passed('Live final-exam session started', { sessionId: started.sessionId })

  stage = 'answer questions'
  for (let index = 0; index < 10; index++) {
    await page.getByText(`TEST ONLY question ${index + 1}: choose an option.`, { exact: true }).waitFor()
    await page.getByRole('button', { name: index < 7 ? /Expected option/ : /Alternative option/ }).click()
    if (index < 9) await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  passed('Learner answered seven of ten questions correctly through the live exam UI')

  stage = 'submit at passing boundary'
  await page.getByRole('button', { name: 'Submit Exam', exact: true }).click()
  const submission = page.waitForResponse(response => response.url().endsWith(`/api/assessments/${assessmentId}/submit`) && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Submit Now', exact: true }).click()
  result = await jsonResponse(await submission, 'Submit final exam')
  assert.equal(result.score, 70)
  assert.equal(result.passed, true)
  assert.equal(result.scoresReleased, true)
  assert.equal(result.gradingPending, false)
  assert(result.certificate?.id, 'Passing a released objective final must issue a certificate')
  await page.getByText('Passed!', { exact: true }).waitFor()
  await page.getByText('Certificate Issued!', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(folder, '01-passed-result.png'), fullPage: true })
  passed('70 percent equals the passing mark: Passed and Certificate Issued shown on screen', { score: result.score, certificateNumber: result.certificate.certificateNumber })

  stage = 'stored result and completion'
  const storedResult = await prisma.assessmentResult.findUnique({ where: { id: result.resultId } })
  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: learnerId, courseId } } })
  const storedSession = await prisma.examSession.findUnique({ where: { id: started.sessionId } })
  assert.equal(storedResult?.score, 70)
  assert.equal(storedResult?.passed, true)
  assert(storedResult?.gradedAt)
  assert.equal(storedSession?.status, 'SUBMITTED')
  assert.equal(storedSession?.resultId, result.resultId)
  assert.equal(enrollment?.status, 'COMPLETED')
  assert.equal(enrollment?.progress, 100)
  passed('Database contains submitted session, graded passing result and completed enrollment at 100 percent')

  stage = 'duplicate confirmation'
  const confirmation = await jsonResponse(await context.request.post(`/api/assessments/${assessmentId}/submit`, {
    data: { answers: [], sessionId: started.sessionId },
  }), 'Confirm submitted exam')
  assert.equal(confirmation.resultId, result.resultId)
  assert.equal(confirmation.recovered, true)
  assert.equal(await prisma.assessmentResult.count({ where: { userId: learnerId, assessmentId } }), 1)
  assert.equal(await prisma.certificate.count({ where: { userId: learnerId, courseId } }), 1)
  passed('Retry returns the same result without a second attempt or duplicate certificate')

  stage = 'certificates page'
  await page.getByRole('button', { name: 'View Certificate', exact: true }).click()
  await page.waitForURL('**/dashboard/certificates')
  await page.getByText(result.certificate.certificateNumber, { exact: false }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Generate Test Certificate', exact: false }).count(), 0)
  await page.screenshot({ path: path.join(folder, '02-my-certificates.png'), fullPage: true })
  passed('View Certificate opens My Certificates and displays the earned certificate')

  stage = 'notifications and reports'
  const notifications = await jsonResponse(await context.request.get('/api/notifications'), 'Notifications')
  assert(notifications.some(item => item.title.startsWith('Assessment Passed')))
  assert(notifications.some(item => item.title.startsWith('Certificate Issued') && item.href === '/dashboard/certificates'))
  const reports = await jsonResponse(await context.request.get('/api/reports'), 'Learner reports')
  assert(reports.results.some(item => item.id === result.resultId && item.score === 70 && item.passed === true))
  passed('Learner receives pass/certificate notifications and sees the passing score in reports')

  stage = 'PDF certificate download'
  const pdfResponse = await context.request.get(`/api/certificates/${result.certificate.id}/download`)
  assert.equal(pdfResponse.status(), 200)
  assert(pdfResponse.headers()['content-type']?.includes('application/pdf'))
  const pdf = await pdfResponse.body()
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF')
  await writeFile(path.join(folder, 'test-certificate.pdf'), pdf)
  passed('Earned certificate downloads successfully as a PDF', { bytes: pdf.length })

  stage = 'public verification'
  const verificationUrl = `${base}/verify/${encodeURIComponent(result.certificate.certificateNumber)}`
  const publicResponse = await fetch(verificationUrl, { signal: globalThis.AbortSignal.timeout(20000) })
  const html = await publicResponse.text()
  assert.equal(publicResponse.status, 200)
  assert(html.includes('VERIFIED CREDENTIAL') && html.includes('Valid Certification'))
  assert(html.includes(courseTitle))
  assert(html.includes('Successfully completed the final examination'))
  passed('Certificate verifies publicly as valid with its course and description', { verificationUrl })
} catch (error) {
  errorSummary = { stage, name: error.name,
    message: String(error.message).replaceAll(password, '[redacted]').replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]').slice(0, 550) }
  console.log(JSON.stringify({ failure: errorSummary }))
  if (page) await page.screenshot({ path: path.join(folder, 'failure.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser?.close().catch(() => {})
  try {
    // Delete only the IDs created by this run, with ownership/name guards.
    await prisma.$transaction(async tx => {
      await tx.examSession.deleteMany({ where: { userId: learnerId, assessmentId } })
      await tx.course.deleteMany({ where: { id: courseId, creatorId: ownerId, title: courseTitle } })
      await tx.user.deleteMany({ where: { OR: [{ id: learnerId, email }, { id: ownerId, email: `${tag}-owner@example.invalid` }] } })
    })
    assert.equal(await prisma.user.count({ where: { id: { in: [learnerId, ownerId] } } }), 0)
    assert.equal(await prisma.course.count({ where: { id: courseId } }), 0)
    assert.equal(await prisma.assessment.count({ where: { id: assessmentId } }), 0)
    assert.equal(await prisma.certificate.count({ where: { userId: learnerId } }), 0)
    cleanupCompleted = true
    passed('Temporary learner, instructor, course, exam, session, answers, result, certificate and notifications removed')
  } catch (error) {
    console.log(JSON.stringify({ cleanupFailed: true, errorType: error.name, recoveryManifest: path.join(folder, 'cleanup.json') }))
    process.exitCode = 1
  }
  const report = { target: base, tag, completedAt: new Date().toISOString(),
    test: { score: 70, passingScore: 70, objectiveQuestions: 10, correctAnswers: 7,
      releaseScores: true, motionDetectionEnabled: false, camera: 'Chromium synthetic test device; no real identity images' },
    checks, error: errorSummary ?? null, cleanupCompleted,
    certificateNumber: result?.certificate?.certificateNumber ?? null, artifactDirectory: folder }
  await writeFile(path.join(folder, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  await writeFile(path.join(root, '.local/stress-test/final-exam-flow-latest.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ report: path.join(folder, 'report.json'), cleanupCompleted, checks: checks.length }))
  await prisma.$disconnect()
}
