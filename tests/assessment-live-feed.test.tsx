import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAssessmentLiveFeed } from "@/lib/use-assessment-live-feed"
const capture = vi.hoisted(() => vi.fn())
vi.mock("@/lib/exam-live-snapshot", () => ({ captureLiveSnapshot: capture }))
const fetcher = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("fetch", fetcher)
  fetcher.mockReset().mockImplementation(async () => Response.json({ success: true }))
  capture.mockReset().mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })
const advance = () => act(async () => { await vi.advanceTimersByTimeAsync(3000) })
const video = { current: null }
const disconnected = { current: null }

describe("live feed client", () => {
  it("sends health-only heartbeats while there is no readable camera frame", async () => {
    renderHook(() => useAssessmentLiveFeed("exam", "session", true, video, disconnected, "STARTING"))
    await advance()
    const body = JSON.parse(fetcher.mock.calls[0][1].body)
    expect(body).toEqual({ sessionId: "session", cameraStatus: "DISCONNECTED", detectorStatus: "STARTING" })
    expect(body).not.toHaveProperty("snapshot")
  })

  it("sends the actual loading detector status with a ready frame", async () => {
    capture.mockReturnValue("data:image/jpeg;base64,frame")
    renderHook(() => useAssessmentLiveFeed("exam", "session", true, video, disconnected, "LOADING"))
    await advance()
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ cameraStatus: "CONNECTED", detectorStatus: "LOADING" })
  })

  it("halts repeated rejected payloads and offers an explicit retry", async () => {
    fetcher.mockImplementation(async () => Response.json({ error: "Invalid active session" }, { status: 403 }))
    const { result } = renderHook(() => useAssessmentLiveFeed("exam", "session", true, video, disconnected, "STARTING"))
    await advance()
    await advance()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.feedError).toBe("Invalid active session")
    fetcher.mockImplementation(async () => Response.json({ success: true }))
    act(() => result.current.retryFeed())
    await advance()
    expect(result.current.feedError).toBeNull()
    expect(fetcher.mock.calls.length).toBeGreaterThan(1)
  })

  it("does not send heartbeats outside a taking phase", async () => {
    renderHook(() => useAssessmentLiveFeed("exam", "session", false, video, disconnected, "STARTING"))
    await advance()
    expect(fetcher).not.toHaveBeenCalled()
  })
})
