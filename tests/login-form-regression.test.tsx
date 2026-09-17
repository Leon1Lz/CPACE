import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), push: vi.fn() }))
vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => new URLSearchParams() }))
import { LoginForm } from "@/components/auth/login-form"

beforeEach(() => { vi.resetAllMocks(); mocks.signIn.mockResolvedValue({ ok: true }) })
afterEach(cleanup)

it("does not display an admin test-account shortcut or prefilled credentials", () => {
  render(<LoginForm />)
  expect(screen.queryByRole("button", { name: /admin test account/i })).not.toBeInTheDocument()
  expect(screen.getByLabelText("Email Address")).toHaveValue("")
  expect(screen.getByLabelText("Password")).toHaveValue("")
  expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password")
})

it("still signs in with credentials supplied by the user", async () => {
  render(<LoginForm />)
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "Learner@Example.com" } })
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "entered-password" } })
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!)
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"))
  expect(mocks.signIn).toHaveBeenCalledWith("credentials", { email: "learner@example.com", password: "entered-password", redirect: false })
})
