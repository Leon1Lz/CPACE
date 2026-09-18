import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cameraErrorMessage, useAssessmentCamera } from "@/lib/use-assessment-camera"

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function cameraApi(getUserMedia: ReturnType<typeof vi.fn> | undefined) {
  vi.stubGlobal("navigator", { mediaDevices: getUserMedia ? { getUserMedia } : undefined })
}

function stream() {
  const track = { readyState: "live", stop: vi.fn() }
  return { track, media: { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream }
}

describe("assessment camera", () => {
  it("handles a missing camera without logging an exception and allows retry", async () => {
    const connected = stream()
    const request = vi.fn().mockRejectedValueOnce(new DOMException("Requested device not found", "NotFoundError"))
      .mockResolvedValueOnce(connected.media)
    cameraApi(request)
    const logged = vi.spyOn(console, "error")
    const { result } = renderHook(useAssessmentCamera)
    await act(async () => { expect(await result.current.startCamera()).toBe(false) })
    expect(result.current.cameraError).toContain("No camera found")
    expect(result.current.cameraActive).toBe(false)
    expect(result.current.cameraStarting).toBe(false)
    expect(logged).not.toHaveBeenCalled()
    await act(async () => { expect(await result.current.startCamera()).toBe(true) })
    expect(result.current.cameraError).toBeNull()
    expect(result.current.cameraActive).toBe(true)
    expect(result.current.streamRef.current).toBe(connected.media)
  })

  it("reports unavailable browser APIs rather than throwing a TypeError", async () => {
    cameraApi(undefined)
    const { result } = renderHook(useAssessmentCamera)
    await act(async () => { expect(await result.current.startCamera()).toBe(false) })
    expect(result.current.cameraError).toContain("HTTPS or localhost")
  })

  it("shares concurrent requests and reuses a live stream", async () => {
    const connected = stream()
    const request = vi.fn().mockResolvedValue(connected.media)
    cameraApi(request)
    const { result } = renderHook(useAssessmentCamera)
    await act(async () => {
      const first = result.current.startCamera()
      expect(result.current.startCamera()).toBe(first)
      await first
    })
    await act(async () => { await result.current.startCamera() })
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith({
      video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: false,
    })
  })

  it.each(["stop", "unmount"])("releases a stream that arrives after %s", async action => {
    const connected = stream()
    let resolve: (value: MediaStream) => void = () => {}
    cameraApi(vi.fn().mockImplementation(() => new Promise<MediaStream>(done => { resolve = done })))
    const { result, unmount } = renderHook(useAssessmentCamera)
    let pending: Promise<boolean> = Promise.resolve(false)
    await act(async () => { pending = result.current.startCamera(); await Promise.resolve() })
    if (action === "unmount") unmount()
    else act(() => result.current.stopCamera())
    await act(async () => { resolve(connected.media); expect(await pending).toBe(false) })
    expect(connected.track.stop).toHaveBeenCalledTimes(1)
    expect(result.current.streamRef.current).toBeNull()
  })

  it("stops active tracks on unmount", async () => {
    const connected = stream()
    cameraApi(vi.fn().mockResolvedValue(connected.media))
    const { result, unmount } = renderHook(useAssessmentCamera)
    await act(async () => { await result.current.startCamera() })
    unmount()
    expect(connected.track.stop).toHaveBeenCalledTimes(1)
  })
})

describe("camera failure messages", () => {
  it.each([
    ["NotAllowedError", "Camera access is blocked"],
    ["NotReadableError", "Close other apps"],
    ["OverconstrainedError", "does not support"],
    ["UnexpectedError", "could not be started"],
  ])("explains %s", (name, message) => {
    expect(cameraErrorMessage({ name })).toContain(message)
  })
})
