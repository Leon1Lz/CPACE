import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ role: "ADMIN", swr: {} as Record<string, unknown>, mutate: vi.fn() }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { role: mocks.role } } }) }))
vi.mock("swr", () => ({ default: () => ({ ...mocks.swr, mutate: mocks.mutate }) }))
import GradingPage from "@/app/dashboard/grading/page"
const submission = () => ({ id: "result", score: 0, passed: false, completedAt: new Date().toISOString(), gradedAt: null, attempt: 1, user: { firstName: "Test", lastName: "Learner" }, assessment: { title: "Essay exam", passingScore: 70, course: { title: "Course" } }, answers: [{ id: "answer", content: "My written answer", points: 0, feedback: null, question: { question: "Explain this topic", type: "ESSAY", points: 10 } }] })
beforeEach(() => { mocks.role = "ADMIN"; mocks.mutate.mockReset(); mocks.swr = { data: { data: [submission()], total: 1, page: 1, totalPages: 1 }, isLoading: false }; vi.spyOn(window, "confirm").mockReturnValue(true) })
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
it("shows written answers and requires explicit points", () => {
  render(<GradingPage />); fireEvent.click(screen.getByRole("button", { name: "Review answers" }))
  expect(screen.getByText("My written answer")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Finalize grades" }))
  expect(screen.getByRole("alert")).toHaveTextContent("Enter valid points")
})
it("preserves marks and feedback after a failed save", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Save unavailable" }) }))
  render(<GradingPage />); fireEvent.click(screen.getByRole("button", { name: "Review answers" }))
  fireEvent.change(screen.getByLabelText("Points (maximum 10)"), { target: { value: "8" } })
  fireEvent.change(screen.getByLabelText("Instructor feedback"), { target: { value: "Good explanation" } })
  fireEvent.click(screen.getByRole("button", { name: "Finalize grades" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Save unavailable")
  expect(screen.getByLabelText("Points (maximum 10)")).toHaveValue(8)
  expect(screen.getByLabelText("Instructor feedback")).toHaveValue("Good explanation")
})
it("refreshes the queue after successful grading", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ score: 80 }) }))
  render(<GradingPage />); fireEvent.click(screen.getByRole("button", { name: "Review answers" }))
  fireEvent.change(screen.getByLabelText("Points (maximum 10)"), { target: { value: "8" } })
  fireEvent.click(screen.getByRole("button", { name: "Finalize grades" }))
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalled())
  expect(screen.queryByRole("button", { name: "Finalize grades" })).not.toBeInTheDocument()
})
it("provides request-failure recovery", () => { mocks.swr = { error: new Error("Offline") }; render(<GradingPage />); fireEvent.click(screen.getByRole("button", { name: "Retry" })); expect(mocks.mutate).toHaveBeenCalled() })
it("does not expose a grading form to learners", () => { mocks.role = "LEARNER"; render(<GradingPage />); expect(screen.queryByRole("button", { name: "Review answers" })).not.toBeInTheDocument() })

it("explains an empty queue and provides working next steps without single-page controls", () => {
  mocks.swr = { data: { data: [], total: 0, page: 1, totalPages: 0 }, isLoading: false }
  render(<GradingPage />)
  expect(screen.getByText("No answers waiting for review")).toBeInTheDocument()
  expect(screen.getByText(/Short answers and essays appear here/)).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Browse courses & assessments" })).toHaveAttribute("href", "/dashboard/courses")
  expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "View finalized grades" }))
  expect(screen.getByLabelText("Status")).toHaveValue("graded")
  expect(screen.getByText("No finalized grades yet")).toBeInTheDocument()
})

it("keeps pagination and recovery when a later page becomes empty", () => {
  mocks.swr = { data: { data: [submission()], total: 30, page: 1, totalPages: 2 }, isLoading: false }
  const view = render(<GradingPage />)
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  mocks.swr = { data: { data: [], total: 0, page: 2, totalPages: 0 }, isLoading: false }
  view.rerender(<GradingPage />)
  expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled()
  fireEvent.click(screen.getByRole("button", { name: "Return to first page" }))
  expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument()
})
