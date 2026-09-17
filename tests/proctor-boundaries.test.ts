import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), user: vi.fn(), access: vi.fn(), scope: vi.fn(), session: vi.fn(), list: vi.fn(), snapshots: vi.fn(), incidents: vi.fn(), count: vi.fn(), authorize: vi.fn(), prune: vi.fn(), update: vi.fn(), audit: vi.fn(), incident: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/proctor-access", () => ({ canAccessExamSession: mocks.access, getProctorSessionScope: mocks.scope }))
vi.mock("@/lib/exam-live-store", () => ({ getAllLiveSnapshots: mocks.snapshots, clearLiveExamState: vi.fn(), getLiveExamState: vi.fn() }))
vi.mock("@/lib/proctoring-retention", () => ({ pruneExpiredProctoringEvidence: mocks.prune, pruneExpiredProctoringSession: mocks.prune }))
vi.mock("@/lib/pusher", () => ({ getPusherServer: () => ({ authorizeChannel: mocks.authorize }), examChatChannel: (id: string) => `private-exam-session-${id}` }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.user }, examSession: { findUnique: mocks.session, findMany: mocks.list },
  proctoringEvent: { findMany: mocks.incidents, count: mocks.count, findUnique: mocks.incident },
  $transaction: (value: Promise<unknown>[] | ((tx: unknown) => unknown)) => Array.isArray(value) ? Promise.all(value) : value({ proctoringEvent: { update: mocks.update }, auditLog: { create: mocks.audit } }),
} }))
import { GET as feed } from "@/app/api/proctor/live-feed/route"
import { GET as detail } from "@/app/api/proctor/sessions/[id]/live/route"
import { GET as chat } from "@/app/api/chat/route"
import { POST as signal } from "@/app/api/proctor/webrtc-signal/route"
import { POST as channelAuth } from "@/app/api/pusher/auth/route"
import { GET as queue } from "@/app/api/proctor/incidents/route"
import { PATCH as review } from "@/app/api/proctor/events/[id]/route"
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "proctor@example.com" } })
  mocks.user.mockResolvedValue({ id: "proctor", role: "PROCTOR" })
  mocks.access.mockResolvedValue(false)
  mocks.scope.mockResolvedValue({ assessment: { courseId: "assigned" } })
  mocks.session.mockResolvedValue({ userId: "learner", status: "IN_PROGRESS" })
  mocks.list.mockResolvedValue([{ id: "allowed", cameraStatus: "CONNECTED" }])
  mocks.snapshots.mockReturnValue({ allowed: { snapshot: "allowed-frame" }, foreign: { snapshot: "private-frame" } })
  mocks.incidents.mockResolvedValue([]); mocks.count.mockResolvedValue(0)
})
it("returns only scoped camera frames", async () => {
  const response = await feed(new NextRequest("http://localhost/api/proctor/live-feed"))
  expect((await response.json()).frames).toEqual({ allowed: { snapshot: "allowed-frame" } })
  expect(mocks.list.mock.calls[0][0].where.AND).toEqual([{ assessment: { courseId: "assigned" } }])
})
it("omits camera payloads in health-only list polling", async () => {
  const response = await feed(new NextRequest("http://localhost/api/proctor/live-feed?healthOnly=true"))
  expect((await response.json()).frames).toEqual({})
  expect(mocks.snapshots).not.toHaveBeenCalled()
})
it("restricts snapshots to visible tiles even inside assigned coverage", async () => {
  const response = await feed(new NextRequest("http://localhost/api/proctor/live-feed?ids=foreign"))
  expect((await response.json()).frames).toEqual({})
})
it("denies detail before reading or pruning protected evidence", async () => {
  expect((await detail(new Request("http://localhost"), { params: Promise.resolve({ id: "foreign" }) })).status).toBe(403)
  expect(mocks.prune).not.toHaveBeenCalled(); expect(mocks.session).not.toHaveBeenCalled()
})
it("denies unassigned chat access", async () => {
  expect((await chat(new NextRequest("http://localhost/api/chat?sessionId=foreign"))).status).toBe(403)
})
it("denies unassigned WebRTC negotiation", async () => {
  expect((await signal(new NextRequest("http://localhost", { method: "POST", body: JSON.stringify({ sessionId: "foreign", senderId: "viewer", type: "REQUEST" }) }))).status).toBe(403)
})
const subscription = (channel: string) => {
  const form = new FormData(); form.set("socket_id", "1.2"); form.set("channel_name", channel)
  return new NextRequest("http://localhost", { method: "POST", body: form })
}
it("rejects the former global channel and another proctor's personal channel", async () => {
  expect((await channelAuth(subscription("private-proctor-notifications"))).status).toBe(403)
  expect((await channelAuth(subscription("private-proctor-user-other"))).status).toBe(403)
  expect(mocks.authorize).not.toHaveBeenCalled()
})
it("authorizes only the proctor's own notification channel", async () => {
  mocks.authorize.mockReturnValue({ auth: "authorized" })
  expect((await channelAuth(subscription("private-proctor-user-proctor"))).status).toBe(200)
})
it("scopes incident counts and rows equally and prioritizes high severity", async () => {
  expect((await queue(new NextRequest("http://localhost/api/proctor/incidents"))).status).toBe(200)
  const query = mocks.incidents.mock.calls[0][0]
  expect(query.where).toEqual(mocks.count.mock.calls[0][0].where)
  expect(query.where.session).toEqual({ assessment: { courseId: "assigned" } })
  expect(query.orderBy).toEqual([{ severity: "desc" }, { createdAt: "asc" }, { id: "asc" }])
  expect(query.select).not.toHaveProperty("evidenceSnapshot")
})
it("preserves existing review notes when a detail-page status change omits notes", async () => {
  mocks.access.mockResolvedValue(true); mocks.incident.mockResolvedValue({ sessionId: "allowed" }); mocks.update.mockResolvedValue({ id: "event" })
  expect((await review(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ reviewStatus: "ESCALATED" }) }), { params: Promise.resolve({ id: "event" }) })).status).toBe(200)
  expect(mocks.update.mock.calls[0][0].data.reviewNotes).toBeUndefined()
  expect(mocks.audit).toHaveBeenCalledTimes(1)
})
