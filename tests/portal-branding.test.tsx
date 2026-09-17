import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { AppSidebar } from "@/components/wireframe/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }))
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }))
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }))

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe("CPACE portal branding and navigation", () => {
  it("uses the landing page logo and identifies the active dashboard", () => {
    render(<SidebarProvider><AppSidebar role="admin" /></SidebarProvider>)
    expect(screen.getByAltText("CPACE Philippines — Continuing Education")).toHaveAttribute("src", "/cpace-logo.png")
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "User Management" })).toBeInTheDocument()
  })

  it("keeps learner navigation scoped to learning features", () => {
    render(<SidebarProvider><AppSidebar role="learner" /></SidebarProvider>)
    expect(screen.getByRole("link", { name: "My Learning Paths" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "User Management" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Exam Monitor" })).not.toBeInTheDocument()
  })

  it("keeps proctor monitoring accessible", () => {
    render(<SidebarProvider><AppSidebar role="proctor" /></SidebarProvider>)
    expect(screen.getByRole("link", { name: "Exam Monitor" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "User Management" })).not.toBeInTheDocument()
  })

  it("preserves the navigation lock while an exam is being taken", () => {
    render(<SidebarProvider><AppSidebar role="learner" isExamTaking /></SidebarProvider>)
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument()
    expect(screen.getByText("Courses & Assessments").closest("div")).toHaveAttribute("title", "Navigation is locked during examination")
  })
})
