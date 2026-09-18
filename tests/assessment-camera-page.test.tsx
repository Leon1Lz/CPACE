import { Suspense } from "react"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import TakeAssessmentPage from "@/app/dashboard/assessments/[id]/take/page"

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { id: "learner", role: "LEARNER" } } }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/components/ui/exam-chat", () => ({ ExamChat: () => null }))
vi.mock("@/components/proctoring/exam-motion-monitor", () => ({ ExamMotionMonitor: () => null }))
vi.mock("@/components/proctoring/learner-video-broadcaster", () => ({ LearnerVideoBroadcaster: () => null }))
const mediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices")
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals()
  if (mediaDevicesDescriptor) Object.defineProperty(navigator, "mediaDevices", mediaDevicesDescriptor)
  else delete (navigator as unknown as Record<string, unknown>).mediaDevices
})

it("shows the missing-device message and keeps a final exam locked after a failed check", async () => {
  const getUserMedia = vi.fn().mockRejectedValue(new DOMException("Requested device not found", "NotFoundError"))
  const originalNavigator = navigator
  Object.defineProperty(originalNavigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
  const fetcher = vi.fn().mockResolvedValue(Response.json({
    id: "exam", title: "Camera regression exam", type: "FINAL_EXAM", timeLimit: 30,
    attempts: 2, passingScore: 70, course: { id: "course", title: "Course" },
    questions: [{ id: "q", question: "Question", type: "SHORT_ANSWER", points: 1, order: 0, options: [] }],
    _count: { results: 0 },
  }))
  vi.stubGlobal("fetch", fetcher)
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => {})
  const params = Promise.resolve({ id: "exam" })
  await act(async () => {
    render(<Suspense fallback={<p>Loading</p>}><TakeAssessmentPage params={params} /></Suspense>)
    await params
  })
  fireEvent.click(await screen.findByRole("button", { name: "Enable Webcam" }))
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No camera found"))
  expect(screen.getByRole("button", { name: "Enable Webcam" })).toBeEnabled()
  expect(screen.getByRole("button", { name: "Enable Webcam to Unlock" })).toBeDisabled()
  fireEvent.click(screen.getByRole("button", { name: "Run Camera Check" }))
  await screen.findByText(/Camera check could not run/)
  expect(screen.getByRole("button", { name: "Enable Webcam to Unlock" })).toBeDisabled()
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(errorLog).not.toHaveBeenCalledWith("Camera access failed:", expect.anything())
})
