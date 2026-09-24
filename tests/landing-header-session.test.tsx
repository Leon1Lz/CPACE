import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

const { mockUseSession, mockSignOut } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockSignOut: vi.fn(),
}))

vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
vi.mock("next-auth/react", () => ({
  useSession: mockUseSession,
  signOut: mockSignOut,
}))
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { Header } from "@/components/layout/header"

beforeEach(() => {
  mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it("shows registration and login actions to signed-out visitors", () => {
  render(<Header />)

  expect(screen.getAllByRole("link", { name: "Register" })).not.toHaveLength(0)
  expect(screen.getAllByRole("link", { name: "Learning Portal" })).not.toHaveLength(0)
  expect(screen.queryByRole("button", { name: /Open profile menu/ })).not.toBeInTheDocument()
})

it("shows the signed-in user's profile instead of login actions", async () => {
  mockUseSession.mockReturnValue({
    data: {
      user: {
        id: "user-1",
        name: "Maria Santos",
        email: "maria@example.com",
        role: "LEARNER",
      },
      expires: "2099-01-01T00:00:00.000Z",
    },
    status: "authenticated",
  })

  render(<Header />)

  expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Learning Portal" })).not.toBeInTheDocument()

  const profileTrigger = screen.getByRole("button", { name: "Open profile menu for Maria Santos" })
  expect(profileTrigger).toBeInTheDocument()
  fireEvent.keyDown(profileTrigger, { key: "Enter" })

  expect(await screen.findByRole("menuitem", { name: "Go to Dashboard" })).toHaveAttribute("href", "/dashboard")
  expect(screen.getByRole("menuitem", { name: "Account Settings" })).toHaveAttribute("href", "/dashboard/settings")
  fireEvent.click(screen.getByRole("menuitem", { name: "Sign Out" }))
  expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" })
})

it("does not flash login actions while the session is loading", () => {
  mockUseSession.mockReturnValue({ data: null, status: "loading" })

  render(<Header />)

  expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Learning Portal" })).not.toBeInTheDocument()
  expect(screen.getAllByLabelText("Checking account")).not.toHaveLength(0)
})
