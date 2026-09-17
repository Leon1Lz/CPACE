import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ role: "ADMIN", swr: {} as Record<string, unknown>, mutate: vi.fn() }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { role: mocks.role } }, status: "authenticated" }) }))
vi.mock("swr", () => ({ default: () => ({ ...mocks.swr, mutate: mocks.mutate }) }))
import ReportsPage from "@/app/dashboard/reports/page"
const report = () => ({ role: "ADMIN", range: { start: "2026-09-01", end: "2026-09-17", timeZone: "Asia/Manila" }, summary: { enrollments: 0, completed: 0, completionRate: null, attempts: 0, gradedAttempts: 0, passed: 0, passRate: null, averageScore: null, manualReviewSubmissions: 0 }, activity: [{ date: "2026-09-17", day: "Thu", value: 0 }], courses: [], results: [] })
beforeEach(() => { mocks.role = "ADMIN"; mocks.swr = { data: report(), isLoading: false, isValidating: false }; mocks.mutate.mockReset() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it("shows honest empty reports and accessible exact daily counts", () => {
  render(<ReportsPage />)
  expect(screen.getByText("No enrollments in this date range.")).toBeInTheDocument()
  expect(screen.getByText("No submitted assessments in this date range.")).toBeInTheDocument()
  expect(screen.getByText("View exact daily counts")).toBeInTheDocument()
  expect(screen.getAllByText("—").length).toBe(3)
})
it("offers retry and sign-in recovery instead of fabricated zero reports on expiry", () => {
  mocks.swr = { error: new Error("Your session expired. Please sign in again."), isLoading: false }
  render(<ReportsPage />)
  expect(screen.getByRole("alert")).toHaveTextContent("Your session expired")
  fireEvent.click(screen.getByRole("button", { name: "Retry reports" }))
  expect(mocks.mutate).toHaveBeenCalledTimes(1)
  expect(screen.queryByText("No enrollments in this date range.")).not.toBeInTheDocument()
})
it("hides learner exports and does not render unreleased score values", () => {
  mocks.role = "LEARNER"
  mocks.swr = { data: { ...report(), results: [{ id: "held", title: "Held exam", courseTitle: "Course", completedAt: "2026-09-17T10:00:00Z", scoresReleased: false, score: 95, passed: true, manualReview: false }] } }
  render(<ReportsPage />)
  expect(screen.getByRole("heading", { name: "My learning report" })).toBeInTheDocument()
  expect(screen.getByText("Awaiting score release")).toBeInTheDocument()
  expect(screen.queryByText(/95\.0%/)).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /Export/ })).not.toBeInTheDocument()
})
it("does not offer instructors the admin directory export", () => {
  mocks.role = "INSTRUCTOR"
  render(<ReportsPage />)
  expect(screen.getByRole("button", { name: "Export enrollments" })).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Export users" })).not.toBeInTheDocument()
})
it("surfaces failed CSV exports without opening a broken download", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Choose a smaller date range" }, { status: 413 })))
  render(<ReportsPage />)
  fireEvent.click(screen.getByRole("button", { name: "Export enrollments" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Choose a smaller date range")
})
it("directs proctors to the assigned exam monitor", () => {
  mocks.role = "PROCTOR"
  render(<ReportsPage />)
  expect(screen.getByRole("link", { name: "Open Exam Monitor" })).toHaveAttribute("href", "/dashboard/proctor")
})
