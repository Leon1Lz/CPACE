import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const camera = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  streamRef: { current: {} as MediaStream },
}))

vi.mock("@/lib/use-assessment-camera", () => ({
  useAssessmentCamera: () => ({
    streamRef: camera.streamRef,
    cameraError: null,
    cameraStarting: false,
    startCamera: camera.start,
    stopCamera: camera.stop,
  }),
}))

vi.mock("@/components/proctoring/exam-motion-monitor", () => ({
  ExamMotionMonitor: ({ onStatusChange, onViolation }: {
    onStatusChange: (status: string) => void
    onViolation: (event: { type: string; description: string; severity: "warning"; duration: number }) => void
  }) => (
    <div>
      <button type="button" onClick={() => onStatusChange("active")}>Activate test detector</button>
      <button type="button" onClick={() => onViolation({ type: "Looking left", description: "Test", severity: "warning", duration: 3 })}>Cross test threshold</button>
    </div>
  ),
}))

import { MotionThresholdTest } from "@/components/proctoring/motion-threshold-test"

const config = { holdMs: 2500, cooldownMs: 12000 }

afterEach(() => cleanup())
beforeEach(() => {
  vi.clearAllMocks()
  camera.start.mockResolvedValue(true)
})

it("requests an admin camera and stays inactive when it cannot start", async () => {
  camera.start.mockResolvedValue(false)
  render(<MotionThresholdTest config={config} />)

  fireEvent.click(screen.getByRole("button", { name: "Start threshold test" }))
  await waitFor(() => expect(camera.start).toHaveBeenCalledOnce())
  expect(screen.queryByRole("button", { name: "Activate test detector" })).not.toBeInTheDocument()
})

it("uses unsaved admin timing and reports local threshold crossings", async () => {
  render(<MotionThresholdTest config={config} />)

  expect(screen.getByText(/at least 2.5 seconds/)).toBeInTheDocument()
  expect(screen.getByText(/pause for 12 seconds/)).toBeInTheDocument()
  expect(screen.getByText(/before you save them/)).toBeInTheDocument()
  expect(screen.getByText(/do not create incidents/)).toBeInTheDocument()

  fireEvent.click(screen.getByRole("button", { name: "Start threshold test" }))
  await screen.findByRole("button", { name: "Activate test detector" })
  fireEvent.click(screen.getByRole("button", { name: "Activate test detector" }))
  expect(screen.getByText(/Detector ready/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Cross test threshold" }))
  expect(screen.getByText("Threshold crossed successfully")).toBeInTheDocument()
  expect(screen.getByText("Looking left").closest("p")).toHaveTextContent("after approximately 3 seconds")

  fireEvent.click(screen.getByRole("button", { name: "Stop test" }))
  expect(camera.stop).toHaveBeenCalledOnce()
})
