import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
const mocks = vi.hoisted(() => ({ data: {} as Record<string, unknown>, mutate: vi.fn() }))
vi.mock("swr", () => ({ default: () => ({ data: mocks.data, mutate: mocks.mutate, isLoading: false, error: null }) }))
import { ProctorAssignments } from "@/components/proctoring/proctor-assignments"
import { IncidentQueue } from "@/components/proctoring/incident-queue"
beforeEach(() => { mocks.mutate.mockReset(); mocks.data = { assignments: [], proctors: [{ id: "proctor", firstName: "Pat", lastName: "Proctor" }], courses: [{ id: "course", title: "CFMS", groups: [{ group: { id: "group", name: "CFMS A" } }] }] } })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it("explains the empty assignment view and does not offer proctor self-assignment", () => {
  render(<ProctorAssignments isAdmin={false} onChanged={vi.fn()} />)
  expect(screen.getByText(/Real sessions will appear after an admin assigns you/)).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Assign proctor" })).not.toBeInTheDocument()
})
it("lets admins save linked group coverage with the correct identifiers", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ id: "assignment" }))
  vi.stubGlobal("fetch", fetcher)
  const changed = vi.fn()
  render(<ProctorAssignments isAdmin onChanged={changed} />)
  fireEvent.click(screen.getByText("Manage proctor assignments"))
  fireEvent.change(screen.getByLabelText("Proctor"), { target: { value: "proctor" } })
  fireEvent.change(screen.getByLabelText("Course"), { target: { value: "course" } })
  fireEvent.change(screen.getByLabelText("Group"), { target: { value: "group" } })
  fireEvent.click(screen.getByRole("button", { name: "Assign proctor" }))
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1))
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ proctorId: "proctor", courseId: "course", groupId: "group" })
})
it("requires confirmation before removing coverage", async () => {
  mocks.data.assignments = [{ id: "assignment", proctor: { firstName: "Pat", lastName: "Proctor" }, course: { title: "CFMS" }, group: null }]
  const fetcher = vi.fn().mockResolvedValue(Response.json({ removed: true })); vi.stubGlobal("fetch", fetcher)
  render(<ProctorAssignments isAdmin onChanged={vi.fn()} />)
  fireEvent.click(screen.getByText("Manage proctor assignments"))
  fireEvent.click(screen.getByRole("button", { name: "Remove" }))
  expect(fetcher).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button", { name: "Confirm removal" }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  expect(fetcher.mock.calls[0][1].method).toBe("DELETE")
})
it("keeps review notes visible when an incident save fails", async () => {
  mocks.data = { total: 1, incidents: [{ id: "incident", sessionId: "exam", type: "NO_FACE", severity: "HIGH", description: "Left frame", createdAt: "2026-09-17T12:00:00Z", reviewStatus: "PENDING", reviewNotes: null, reviewedByName: null, session: { user: { firstName: "Lee", lastName: "Learner" }, assessment: { title: "Final exam" } } }] }
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Session not assigned" }, { status: 403 })))
  render(<IncidentQueue />)
  fireEvent.change(screen.getByLabelText("Review notes"), { target: { value: "Need a second reviewer" } })
  fireEvent.click(screen.getByRole("button", { name: "Save review" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Session not assigned")
  expect(screen.getByLabelText("Review notes")).toHaveValue("Need a second reviewer")
  expect(mocks.mutate).not.toHaveBeenCalled()
})
