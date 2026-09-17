import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
const mocks = vi.hoisted(() => ({ stats: {} as Record<string, unknown>, paths: [] as unknown[] }))
vi.mock("swr", () => ({ default: (key: string) => key === "/api/learning-paths" ? { data: mocks.paths } : mocks.stats }))
vi.mock("recharts", () => {
  const container = ({ children }: { children: ReactNode }) => <div>{children}</div>
  const empty = () => null
  return { ResponsiveContainer: container, AreaChart: ({ data, children }: { data: unknown; children: ReactNode }) => <div><pre data-testid="actual-chart-data">{JSON.stringify(data)}</pre>{children}</div>, BarChart: container, Area: empty, Bar: empty, XAxis: empty, YAxis: empty, Tooltip: empty, CartesianGrid: empty }
})
import { AdminDashboard, InstructorDashboard, ProctorDashboard, LearnerDashboard } from "@/components/wireframe/dashboards"
beforeEach(() => { mocks.stats = {}; mocks.paths = [] })
afterEach(cleanup)
it.each([
  [AdminDashboard, "Failed to load admin stats"], [InstructorDashboard, "Failed to load instructor stats"],
  [ProctorDashboard, "Failed to load proctor stats"], [LearnerDashboard, "Failed to load learner dashboard"],
])("shows a recovery state when role dashboard data fails", (Dashboard, title) => {
  mocks.stats = { error: new Error("401"), isLoading: false }
  render(<Dashboard />)
  expect(screen.getByRole("heading", { name: title as string })).toBeInTheDocument()
})
it("uses real activity values instead of synthesizing a chart from totals", () => {
  mocks.stats = { data: { totalUsers: 8, totalCourses: 3, totalEnrollments: 100, totalCertificates: 1, recentEnrollments: [], enrollmentActivity: [{ date: "2026-09-17", day: "Thu", value: 0 }] }, isLoading: false }
  render(<AdminDashboard />)
  expect(screen.getByTestId("actual-chart-data")).toHaveTextContent('"value":0')
  expect(screen.getByText("Enrollment Activity (Last 7 Days)")).toBeInTheDocument()
  expect(screen.queryByText("Live")).not.toBeInTheDocument()
})
it("routes learners directly to the next unlocked path resource", () => {
  mocks.stats = { data: { enrollments: [], certificates: [], upcomingAssessments: [] } }
  mocks.paths = [{ id: "path", title: "CFMS journey", progress: 0, currentStepId: "step", steps: [{ id: "step", type: "COURSE", completed: false, locked: false, title: "Foundation", href: "/dashboard/courses/foundation" }] }]
  render(<LearnerDashboard />)
  expect(screen.getByRole("link", { name: "Continue my learning path" })).toHaveAttribute("href", "/dashboard/courses/foundation")
})
