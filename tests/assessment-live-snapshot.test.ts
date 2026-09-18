import { afterEach, describe, expect, it, vi } from "vitest"
import { captureLiveSnapshot, MAX_LIVE_SNAPSHOT_BYTES } from "@/lib/exam-live-snapshot"
afterEach(() => vi.restoreAllMocks())
const media = (readyState = "live") => ({ getVideoTracks: () => [{ readyState }] }) as unknown as MediaStream
const video = (readyState = 2) => ({ readyState, videoWidth: 320, videoHeight: 240 }) as HTMLVideoElement

describe("live snapshot readiness", () => {
  it.each([
    [null, media()], [video(), null], [video(1), media()], [video(), media("ended")],
  ])("never draws an unreadable frame", (element, stream) => {
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
    expect(captureLiveSnapshot(element, stream)).toBeNull()
    expect(context).not.toHaveBeenCalled()
  })

  it("captures a bounded JPEG only from a live, ready camera", () => {
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    const jpeg = `data:image/jpeg;base64,${Buffer.alloc(128).toString("base64")}`
    const encode = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(jpeg)
    const element = video()
    expect(captureLiveSnapshot(element, media())).toBe(jpeg)
    expect(drawImage).toHaveBeenCalledWith(element, 0, 0, 160, 120)
    expect(encode).toHaveBeenCalledWith("image/jpeg", 0.6)
  })

  it.each(["data:,", `data:image/jpeg;base64,${Buffer.alloc(MAX_LIVE_SNAPSHOT_BYTES + 1).toString("base64")}`])("rejects empty or oversized canvas exports", snapshot => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(snapshot)
    expect(captureLiveSnapshot(video(), media())).toBeNull()
  })
})
