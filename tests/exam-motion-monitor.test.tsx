import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  resolveFiles: vi.fn(),
  create: vi.fn(),
  detect: vi.fn(),
  close: vi.fn(),
}))

vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: mocks.resolveFiles },
  FaceLandmarker: { createFromOptions: mocks.create },
}))

import { ExamMotionMonitor, type DetectorStatus } from "@/components/proctoring/exam-motion-monitor"

function renderMonitor(onStatusChange = vi.fn<(status: DetectorStatus) => void>()) {
  let frame = 0
  const videoRef = (element: HTMLVideoElement | null) => {
    if (!element) return
    Object.defineProperty(element, "readyState", { configurable: true, value: 4 })
    Object.defineProperty(element, "currentTime", { configurable: true, get: () => ++frame })
  }
  render(
    <ExamMotionMonitor
      enabled
      videoRef={videoRef}
      onViolation={vi.fn()}
      onStatusChange={onStatusChange}
    />,
  )
  return onStatusChange
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.resolveFiles.mockResolvedValue({ wasmLoaderPath: "loader", wasmBinaryPath: "binary" })
  mocks.detect.mockReturnValue({ faceLandmarks: [] })
  mocks.create.mockResolvedValue({ detectForVideo: mocks.detect, close: mocks.close })
})

afterEach(() => cleanup())

it("reports active only after the first successful camera-frame inference", async () => {
  const status = renderMonitor()

  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
  expect(status).not.toHaveBeenCalledWith("active")
  await waitFor(() => expect(status).toHaveBeenCalledWith("active"), { timeout: 2000 })
  expect(mocks.resolveFiles).toHaveBeenCalledWith("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm")
})

it("turns inference failures into a visible error and can retry", async () => {
  mocks.detect.mockImplementationOnce(() => { throw new Error("WASM inference failed") })
  const status = renderMonitor()

  const retry = await screen.findByRole("button", { name: "Retry detector" }, { timeout: 2000 })
  expect(status).toHaveBeenCalledWith("error")
  expect(screen.getByText(/stopped unexpectedly/i)).toBeInTheDocument()

  fireEvent.click(retry)
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(status).toHaveBeenCalledWith("active"), { timeout: 2000 })
})

it("falls back to the CPU delegate when GPU setup fails", async () => {
  mocks.create
    .mockRejectedValueOnce(new Error("GPU unavailable"))
    .mockResolvedValueOnce({ detectForVideo: mocks.detect, close: mocks.close })
  renderMonitor()

  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2))
  expect(mocks.create.mock.calls[0][1].baseOptions.delegate).toBe("GPU")
  expect(mocks.create.mock.calls[1][1].baseOptions.delegate).toBe("CPU")
})
