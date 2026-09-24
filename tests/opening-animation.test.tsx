import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OpeningAnimation } from "@/components/layout/opening-animation"

describe("OpeningAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.sessionStorage.clear()
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }))
  })

  it("plays the supplied opening once per tab and allows it to be skipped", () => {
    const { unmount } = render(<OpeningAnimation />)
    const video = screen.getByLabelText("CPACE Philippines introduction")

    expect(video).toHaveAttribute("src", "/videos/cpace-opening.mp4")
    expect(video).toHaveAttribute("autoplay")
    fireEvent.loadedMetadata(video)
    expect((video as HTMLVideoElement).playbackRate).toBe(1.25)
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }))
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByLabelText("CPACE opening animation")).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem("cpace-opening-seen")).toBe("true")

    unmount()
    render(<OpeningAnimation />)
    expect(screen.queryByLabelText("CPACE opening animation")).not.toBeInTheDocument()
  })

  it("exits safely when playback ends or fails", () => {
    const { unmount } = render(<OpeningAnimation />)
    fireEvent.ended(screen.getByLabelText("CPACE Philippines introduction"))
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByLabelText("CPACE opening animation")).not.toBeInTheDocument()

    unmount()
    window.sessionStorage.clear()
    render(<OpeningAnimation />)
    fireEvent.error(screen.getByLabelText("CPACE Philippines introduction"))
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByLabelText("CPACE opening animation")).not.toBeInTheDocument()
  })

  it("does not force animation on visitors who prefer reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }))
    render(<OpeningAnimation />)
    expect(screen.queryByLabelText("CPACE opening animation")).not.toBeInTheDocument()
  })
})
