import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getProctorHealth } from "@/lib/proctor-health"
import { buildSimulatedMonitor, buildSimulatedSessions } from "@/lib/proctor-simulation"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), assignments: vi.fn(), find: vi.fn(), list: vi.fn(), incident: vi.fn(), update: vi.fn(), options: vi.fn(), course: vi.fn(), groupCourse: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user, findFirst: mocks.options },
  proctorAssignment: { findMany: mocks.assignments },
  examSession: { findFirst: mocks.find, findMany: mocks.list, update: mocks.update },
  proctoringEvent: { findUnique: mocks.incident, update: mocks.update },
  course: { findUnique: mocks.course }, groupCourse: { findUnique: mocks.groupCourse },
} }))
import { buildProctorSessionScope, canAccessExamSession, getProctorSessionScope } from "@/lib/proctor-access"
import { GET as sessions, PATCH as changeSession } from "@/app/api/proctor/sessions/route"
import { PATCH as review } from "@/app/api/proctor/events/[id]/route"
import { POST as assign } from "@/app/api/proctor/assignments/route"

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "proctor@example.com" } })
  mocks.user.mockResolvedValue({ id: "proctor", role: "PROCTOR" })
  mocks.assignments.mockResolvedValue([{ courseId: "course", groupId: "group" }])
  mocks.list.mockResolvedValue([])
  mocks.find.mockResolvedValue(null)
})
describe("assignment isolation", () => {
  it("denies all real sessions with no assignments", () => {
    expect(buildProctorSessionScope([])).toEqual({ id: { in: [] } })
  })
  it("combines course and group constraints within each assignment", () => {
    expect(buildProctorSessionScope([{ courseId: "course", groupId: "group" }, { courseId: "other", groupId: null }])).toEqual({ OR: [
      { assessment: { courseId: "course" }, user: { groupMemberships: { some: { groupId: "group" } } } },
      { assessment: { courseId: "other" } },
    ] })
  })
  it("allows admin coverage without reading assignments", async () => {
    expect(await getProctorSessionScope({ id: "admin", role: "ADMIN" })).toEqual({})
    expect(mocks.assignments).not.toHaveBeenCalled()
  })
  it("preserves learner-owned session access", async () => {
    mocks.find.mockResolvedValue({ id: "session" })
    expect(await canAccessExamSession({ id: "learner", role: "LEARNER" }, "session")).toBe(true)
    expect(mocks.find.mock.calls[0][0].where).toEqual({ AND: [{ id: "session" }, { userId: "learner" }] })
  })
  it("scopes the list and does not select identity documents or draft answers", async () => {
    const response = await sessions(new NextRequest("http://localhost/api/proctor/sessions"))
    expect(response.status).toBe(200)
    const query = mocks.list.mock.calls[0][0]
    expect(query.where.AND).toEqual([buildProctorSessionScope([{ courseId: "course", groupId: "group" }])])
    expect(query.select).not.toHaveProperty("identityPhoto")
    expect(query.select).not.toHaveProperty("draftAnswers")
  })
  it("rejects an unassigned incident before any update", async () => {
    mocks.incident.mockResolvedValue({ sessionId: "unassigned" })
    const response = await review(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ reviewStatus: "CONFIRMED" }) }), { params: Promise.resolve({ id: "incident" }) })
    expect(response.status).toBe(403)
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("rejects an unassigned session update", async () => {
    const response = await changeSession(new NextRequest("http://localhost", { method: "PATCH", body: JSON.stringify({ id: "unassigned", flagged: true }) }))
    expect(response.status).toBe(403)
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("does not let a proctor assign themself", async () => {
    const response = await assign(new Request("http://localhost", { method: "POST", body: JSON.stringify({ proctorId: "proctor", courseId: "course" }) }))
    expect(response.status).toBe(403)
  })
  it("rejects a group not linked to the selected course", async () => {
    mocks.user.mockResolvedValue({ id: "admin", role: "ADMIN" })
    mocks.options.mockResolvedValue({ id: "proctor" }); mocks.course.mockResolvedValue({ id: "course" }); mocks.groupCourse.mockResolvedValue(null)
    const response = await assign(new Request("http://localhost", { method: "POST", body: JSON.stringify({ proctorId: "proctor", courseId: "course", groupId: "foreign" }) }))
    expect(response.status).toBe(400)
  })
  it("maintains isolation across 50 simultaneous list requests", async () => {
    const responses = await Promise.all(Array.from({ length: 50 }, () => sessions(new NextRequest("http://localhost/api/proctor/sessions?pagination=true"))))
    expect(responses.every(response => response.status === 200)).toBe(true)
    expect(mocks.list).toHaveBeenCalledTimes(50)
    for (const [query] of mocks.list.mock.calls) expect(query.where.AND).toEqual([buildProctorSessionScope([{ courseId: "course", groupId: "group" }])])
  })
})

describe("connection and synthetic examinees", () => {
  const now = Date.parse("2026-09-17T12:00:00Z")
  const active = { status: "IN_PROGRESS", lastHeartbeatAt: new Date(now - 1000).toISOString(), cameraStatus: "CONNECTED", detectorStatus: "ACTIVE" }
  it("does not mistake a heartbeat or identity image for a live frame", () => {
    expect(getProctorHealth(active, null, now)).toMatchObject({ connection: "LIVE", camera: "Awaiting frame", needsAttention: true })
  })
  it("requires fresh signals, a connected camera, and a fresh snapshot", () => {
    expect(getProctorHealth(active, new Date(now - 1000).toISOString(), now)).toMatchObject({ camera: "Live camera", needsAttention: false })
  })
  it("does not let a fresh snapshot hide a disconnected heartbeat", () => {
    expect(getProctorHealth({ ...active, lastHeartbeatAt: new Date(now - 45000).toISOString() }, new Date(now).toISOString(), now)).toMatchObject({ connection: "DISCONNECTED", camera: "Feed stale", detector: "Detector offline" })
  })
  it("distinguishes intentionally disabled detection and closed sessions", () => {
    expect(getProctorHealth({ ...active, assessment: { motionDetectionEnabled: false } }, null, now).detector).toBe("Disabled by settings")
    expect(getProctorHealth({ ...active, status: "SUBMITTED" }, null, now)).toMatchObject({ connection: "ENDED", needsAttention: false })
  })
  it("generates 250 unique synthetic sessions with mixed connection states", () => {
    const generated = buildSimulatedSessions(now, 250)
    expect(generated).toHaveLength(250)
    expect(new Set(generated.map(session => session.id)).size).toBe(250)
    expect(new Set(generated.map(session => session.user.email)).size).toBe(250)
    expect(generated.some(session => getProctorHealth(session, session.lastHeartbeatAt, now).connection === "DISCONNECTED")).toBe(true)
    expect(buildSimulatedMonitor("simulation-250", now)?.session.id).toBe("simulation-250")
    expect(buildSimulatedMonitor("simulation-251", now)).toBeNull()
  })
})
