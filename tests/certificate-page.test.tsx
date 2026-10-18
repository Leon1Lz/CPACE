import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({ role: "LEARNER" }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { id: "user-1", role: mocks.role } } }) }))

import CertificatesPage from "@/app/dashboard/certificates/page"

beforeEach(() => {
  mocks.role = "LEARNER"
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({
    data: [{
      id: "earned-certificate",
      title: "Certificate of Completion",
      description: "Successfully passed the final examination.",
      certificateNumber: "CPACE-123",
      isValid: true,
      issuedAt: "2026-10-18T00:00:00Z",
      course: { title: "Financial Management" },
    }],
    total: 1,
    totalPages: 1,
  }) }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe("certificate page generation controls", () => {
  it("lets learners download earned certificates without a generate button", async () => {
    render(<CertificatesPage />)
    expect(await screen.findByRole("link", { name: "Download" })).toHaveAttribute("href", "/api/certificates/earned-certificate/download")
    expect(screen.queryByRole("button", { name: "Generate Test Certificate" })).not.toBeInTheDocument()
  })

  it("keeps the test generator available to administrators", async () => {
    mocks.role = "ADMIN"
    render(<CertificatesPage />)
    expect(screen.getByRole("button", { name: "Generate Test Certificate" })).toBeInTheDocument()
    expect(await screen.findByText("Certificate of Completion")).toBeInTheDocument()
  })
})
