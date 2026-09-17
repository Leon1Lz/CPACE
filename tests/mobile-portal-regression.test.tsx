import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }))
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }))
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }))
import { AppSidebar } from "@/components/wireframe/app-sidebar"
import { signOut } from "next-auth/react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
const originalWidth = window.innerWidth
beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { value: 390, configurable: true })
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals(); Object.defineProperty(window, "innerWidth", { value: originalWidth, configurable: true }) })
it.each(["admin", "instructor", "learner", "proctor"] as const)("opens an accessible mobile drawer for %s", async role => {
  render(<SidebarProvider><AppSidebar role={role} /><SidebarTrigger /></SidebarProvider>)
  fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
  expect(await screen.findByRole("dialog", { name: "Sidebar" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
  expect(screen.getByText("Overview")).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument()
  if (role === "admin") {
    expect(screen.getByText("Learning", { exact: true })).toBeInTheDocument()
    expect(screen.getByText("Exams & Results")).toBeInTheDocument()
    expect(screen.getByText("Administration")).toBeInTheDocument()
  }
  expect(screen.getByAltText("CPACE Philippines — Continuing Education")).toBeInTheDocument()
  if (role === "learner") expect(screen.getByRole("link", { name: "My Progress" })).toHaveAttribute("href", "/dashboard/reports")
  if (role === "proctor") expect(screen.queryByRole("link", { name: "Reports" })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
})
it("keeps exam navigation locked inside the mobile drawer", async () => {
  render(<SidebarProvider><AppSidebar role="learner" isExamTaking /><SidebarTrigger /></SidebarProvider>)
  fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
  await screen.findByRole("dialog", { name: "Sidebar" })
  expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument()
  expect(screen.getByText("My Progress").closest("div")).toHaveAttribute("title", "Navigation is locked during examination")
})

it("opens account settings from the single account menu", async () => {
  render(<SidebarProvider><AppSidebar role="admin" /><SidebarTrigger /></SidebarProvider>)
  fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
  await screen.findByRole("dialog", { name: "Sidebar" })
  fireEvent.keyDown(screen.getByRole("button", { name: "Account menu" }), { key: "Enter" })
  expect(await screen.findByRole("menuitem", { name: "Account Settings" })).toHaveAttribute("href", "/dashboard/settings")
  expect(screen.getByRole("menuitem", { name: "Sign Out" })).toBeInTheDocument()
})

it("locks account settings during an exam", async () => {
  render(<SidebarProvider><AppSidebar role="learner" isExamTaking /><SidebarTrigger /></SidebarProvider>)
  fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
  await screen.findByRole("dialog", { name: "Sidebar" })
  fireEvent.keyDown(screen.getByRole("button", { name: "Account menu" }), { key: "Enter" })
  expect(await screen.findByRole("menuitem", { name: "Account Settings (exam locked)" })).toHaveAttribute("aria-disabled", "true")
  expect(screen.queryByRole("link", { name: "Account Settings" })).not.toBeInTheDocument()
  vi.spyOn(window, "confirm").mockReturnValue(false)
  fireEvent.click(screen.getByRole("menuitem", { name: "Sign Out" }))
  expect(window.confirm).toHaveBeenCalled()
  expect(signOut).not.toHaveBeenCalled()
})
