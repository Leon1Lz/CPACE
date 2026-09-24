import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import ManageQuestionsPage from "@/app/dashboard/assessments/[id]/manage/page"

const navigation = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "admin", role: "ADMIN" } }, status: "authenticated" }),
}))
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "exam" }),
  useRouter: () => navigation,
}))
vi.mock("@/components/ui/rich-text-editor", () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}))
vi.mock("@/components/proctoring/motion-threshold-test", () => ({
  MotionThresholdTest: ({ config }: { config: { holdMs: number; cooldownMs: number } }) => (
    <div data-testid="admin-motion-threshold-test">
      {config.holdMs}:{config.cooldownMs}
    </div>
  ),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("places the threshold tester with the motion controls on the admin management page", async () => {
  const assessment = {
    id: "exam",
    title: "Final exam",
    type: "FINAL_EXAM",
    courseId: "course",
    timeLimit: 60,
    attempts: 1,
    passingScore: 70,
    detectionHoldMs: 3200,
    detectionCooldownMs: 9000,
    _count: { questions: 0 },
  }
  const fetcher = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith("/questions")) return Promise.resolve(Response.json([]))
    if (url.includes("/api/courses")) return Promise.resolve(Response.json([]))
    return Promise.resolve(Response.json(assessment))
  })
  vi.stubGlobal("fetch", fetcher)

  render(<ManageQuestionsPage />)
  await screen.findByRole("heading", { name: "Final exam" })
  const testButton = screen.getByRole("button", { name: "Test Motion Detector" })
  expect(testButton).toBeVisible()
  fireEvent.click(testButton)

  expect(await screen.findByRole("heading", { name: "Motion Detector Test" })).toBeInTheDocument()
  expect(screen.getByTestId("admin-motion-threshold-test")).toHaveTextContent("3200:9000")

  fireEvent.click(screen.getByRole("checkbox", { name: "Enable motion detection for this exam" }))
  await waitFor(() => expect(screen.queryByTestId("admin-motion-threshold-test")).not.toBeInTheDocument())

  fireEvent.click(screen.getByRole("button", { name: "Save Motion Settings" }))
  await waitFor(() => expect(fetcher.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(true))
  const saveCall = fetcher.mock.calls.find(([, init]) => init?.method === "PATCH")
  expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({
    motionDetectionEnabled: false,
    detectionHoldMs: 3200,
    detectionCooldownMs: 9000,
  })
})
