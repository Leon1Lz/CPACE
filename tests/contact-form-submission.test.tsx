import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { ContactSection } from "@/components/sections/contact-section"

const submit = vi.hoisted(() => vi.fn())
vi.mock("@/lib/public-form-client", () => ({ submitPublicForm: submit }))
beforeEach(() => { submit.mockReset() })
afterEach(cleanup)

describe.each([
  ["portal", ContactSection],
] as const)("%s contact form", (_name, Component) => {
  function fillForm() {
    render(<Component />)
    fireEvent.change(screen.getByLabelText("Full Name *"), { target: { value: "Test Sender" } })
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "sender@example.com" } })
    fireEvent.change(screen.getByLabelText("Your Message / Inquiry *"), { target: { value: "Please send course information." } })
    fireEvent.submit(screen.getByRole("button", { name: "Submit Inquiry" }).closest("form")!)
  }

  it("keeps the entered text and enables retry when delivery fails", async () => {
    submit.mockRejectedValue(new Error("Email delivery unavailable"))
    fillForm()
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Email delivery unavailable"))
    expect(screen.getByLabelText("Full Name *")).toHaveValue("Test Sender")
    expect(screen.getByLabelText("Your Message / Inquiry *")).toHaveValue("Please send course information.")
    expect(screen.getByRole("button", { name: "Submit Inquiry" })).toBeEnabled()
    expect(screen.queryByText("Message Received!")).not.toBeInTheDocument()
  })

  it("shows receipt only after the submission is acknowledged", async () => {
    submit.mockResolvedValue(undefined)
    fillForm()
    await waitFor(() => expect(screen.getByText("Message Received!")).toBeInTheDocument())
    expect(submit).toHaveBeenCalledWith("/api/contact", expect.objectContaining({
      name: "Test Sender", email: "sender@example.com", message: "Please send course information.",
    }))
  })
})
