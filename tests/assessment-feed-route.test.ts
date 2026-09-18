import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), snapshot: vi.fn(), event: vi.fn() }))
vi.mock("next-auth/next", () => ({ getServerSession: mocks.auth }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: async () => ({ id: "learner" }) },
  examSession: { updateMany: mocks.update },
} }))
vi.mock("@/lib/pusher", () => ({ triggerEvent: mocks.event }))
vi.mock("@/lib/exam-live-store", () => ({ setLiveSnapshot: mocks.snapshot }))
import { POST } from "@/app/api/assessments/[id]/session/feed/route"
import { isSafeImageDataUrl } from "@/lib/authorization"
const context = { params: Promise.resolve({ id: "exam" }) }
const request = (body: unknown) => new NextRequest("http://localhost/api/assessments/exam/session/feed", {
  method: "POST", body: JSON.stringify(body),
})
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6EfoAAAAASUVORK5CYII="
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "learner" } })
  mocks.update.mockResolvedValue({ count: 1 })
})

describe("exam live feed validation", () => {
  it("accepts small live frames while keeping the stricter identity image minimum", async () => {
    expect(isSafeImageDataUrl(tinyPng)).toBe(false)
    const response = await POST(request({ sessionId: "session", snapshot: tinyPng }), context)
    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "session", userId: "learner", assessmentId: "exam", status: "IN_PROGRESS" },
      data: expect.objectContaining({ cameraStatus: "CONNECTED", lastHeartbeatAt: expect.any(Date) }),
    }))
    expect(mocks.snapshot).toHaveBeenCalledWith("session", tinyPng)
  })

  it("reports disconnected device health without storing or broadcasting a fake frame", async () => {
    expect((await POST(request({ sessionId: "session", cameraStatus: "DISCONNECTED", detectorStatus: "STARTING" }), context)).status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ cameraStatus: "DISCONNECTED", detectorStatus: "STARTING" }) }))
    expect(mocks.snapshot).not.toHaveBeenCalled()
    expect(mocks.event).not.toHaveBeenCalled()
  })

  it("does not allow a health-only request to claim a connected camera", async () => {
    expect((await POST(request({ sessionId: "session", cameraStatus: "CONNECTED" }), context)).status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it.each(["data:,", "data:image/svg+xml;base64,PHN2Zz4=", "not-an-image"])("reports invalid frames as 400 rather than 413", async snapshot => {
    expect((await POST(request({ sessionId: "session", snapshot }), context)).status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("reserves 413 for images over the actual size limit", async () => {
    const bytes = Buffer.alloc(512 * 1024 + 1)
    const snapshot = `data:image/jpeg;base64,${bytes.toString("base64")}`
    expect((await POST(request({ sessionId: "session", snapshot }), context)).status).toBe(413)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("does not publish snapshots for an inactive or foreign session", async () => {
    mocks.update.mockResolvedValue({ count: 0 })
    expect((await POST(request({ sessionId: "foreign", snapshot: tinyPng }), context)).status).toBe(403)
    expect(mocks.snapshot).not.toHaveBeenCalled()
  })

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await POST(request({ sessionId: "session", snapshot: tinyPng }), context)).status).toBe(401)
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
