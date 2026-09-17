import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), assessment: vi.fn(), marker: vi.fn(), sessions: vi.fn(), results: vi.fn(), create: vi.fn(), remove: vi.fn(), update: vi.fn(), raw: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user }, assessment: { findUnique: mocks.assessment },
  $transaction: (callback: (tx: unknown) => unknown) => callback({
    $queryRaw: mocks.raw,
    assessment: { findUnique: mocks.marker, update: mocks.update, delete: mocks.remove },
    examSession: { count: mocks.sessions }, assessmentResult: { count: mocks.results },
    question: { count: async () => 0, create: mocks.create, deleteMany: mocks.remove }, course: { delete: mocks.remove },
  }),
} }))
import { POST as add } from "@/app/api/assessments/[id]/questions/route"
import { DELETE as removeQuestion } from "@/app/api/assessments/[id]/questions/[qid]/route"
import { POST as importCSV } from "@/app/api/assessments/[id]/import-csv/route"
import { DELETE as removeAssessment } from "@/app/api/assessments/[id]/route"
import { DELETE as removeCourse } from "@/app/api/courses/[id]/route"
const context = { params: Promise.resolve({ id: "exam", qid: "question" }) }
const questionRequest = () => new NextRequest("http://localhost/api/assessments/exam/questions", { method: "POST", body: JSON.stringify({ question: "Write an answer", type: "ESSAY", points: 1 }) })
function csvRequest() {
  const formData = new FormData()
  formData.append("file", new File(["question,type,points\nWrite an answer,ESSAY,1"], "questions.csv", { type: "text/csv" }))
  return { formData: async () => formData } as NextRequest
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "admin@example.com" } })
  mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
  mocks.assessment.mockResolvedValue({ course: { instructorId: "instructor" } })
  mocks.marker.mockResolvedValue({ bankLockedAt: null })
  mocks.sessions.mockResolvedValue(0)
  mocks.results.mockResolvedValue(0)
  mocks.raw.mockResolvedValue([{ id: "exam" }])
  mocks.create.mockResolvedValue({ id: "question" })
  mocks.remove.mockResolvedValue({ count: 1 })
})
describe("all question/history mutation boundaries", () => {
  const endpoints = [
    ["add", () => add(questionRequest(), context)],
    ["delete question", () => removeQuestion(questionRequest(), context)],
    ["CSV import", () => importCSV(csvRequest(), context)],
    ["delete assessment", () => removeAssessment(questionRequest(), context)],
    ["delete parent course", () => removeCourse(questionRequest(), context)],
  ] as const
  for (const [name, invoke] of endpoints) {
    it(`${name} rejects existing sessions including abandoned attempts`, async () => {
      mocks.sessions.mockResolvedValue(1)
      expect((await invoke()).status).toBe(409)
      expect(mocks.create).not.toHaveBeenCalled()
      expect(mocks.remove).not.toHaveBeenCalled()
      expect(mocks.sessions.mock.calls[0][0].where).not.toHaveProperty("status")
    })
    it(`${name} stays locked after session/history cleanup`, async () => {
      mocks.marker.mockResolvedValue({ bankLockedAt: new Date() })
      expect((await invoke()).status).toBe(409)
      expect(mocks.remove).not.toHaveBeenCalled()
    })
    it(`${name} rejects historical results`, async () => { mocks.results.mockResolvedValue(1); expect((await invoke()).status).toBe(409) })
    it(`${name} permits a new unused assessment`, async () => expect([200, 201]).toContain((await invoke()).status))
    it(`${name} rejects missing authentication`, async () => { mocks.auth.mockResolvedValue(null); expect((await invoke()).status).toBe(401) })
  }
  it("bank changes increment the version within the transaction", async () => {
    await add(questionRequest(), context)
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "exam" }, data: { questionVersion: { increment: 1 } } })
    expect(mocks.raw.mock.invocationCallOrder[0]).toBeLessThan(mocks.sessions.mock.invocationCallOrder[0])
  })
})
