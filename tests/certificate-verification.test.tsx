import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import VerifyCertificatePage from "@/app/(landing)/verify/[certificateNumber]/page"

const mocks = vi.hoisted(() => ({ findCertificate: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { certificate: { findUnique: mocks.findCertificate } } }))
vi.mock("@/components/layout/header", () => ({ Header: () => null }))
vi.mock("@/components/layout/footer", () => ({ Footer: () => null }))

const certificate = {
  certificateNumber: "CPACE-123",
  description: "Successfully completed the final examination in financial management.",
  isValid: true,
  issuedAt: new Date("2026-01-01"),
  expiresAt: null as Date | null,
  user: { firstName: "Maria", lastName: "Santos", email: "maria@example.com" },
  course: { title: "Financial Management", category: "CFMS" },
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findCertificate.mockResolvedValue(certificate)
})
afterEach(cleanup)

async function showCertificate() {
  render(await VerifyCertificatePage({ params: Promise.resolve({ certificateNumber: "CPACE-123" }) }))
}

describe("public certificate verification", () => {
  it("shows the saved description and valid status without requiring a login", async () => {
    await showCertificate()
    expect(screen.getByText(certificate.description)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "VERIFIED CREDENTIAL" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Valid Certification" })).toBeInTheDocument()
  })

  it("does not present a revoked certificate as valid", async () => {
    mocks.findCertificate.mockResolvedValue({ ...certificate, isValid: false })
    await showCertificate()
    expect(screen.getByRole("heading", { name: "Certificate Revoked" })).toBeInTheDocument()
    expect(screen.queryByText("Valid Certification")).not.toBeInTheDocument()
    expect(screen.queryByText("VERIFIED CREDENTIAL")).not.toBeInTheDocument()
  })

  it("does not present an expired certificate as active", async () => {
    mocks.findCertificate.mockResolvedValue({ ...certificate, expiresAt: new Date("2000-01-01") })
    await showCertificate()
    expect(screen.getByRole("heading", { name: "Certificate Expired" })).toBeInTheDocument()
    expect(screen.queryByText("Valid Certification")).not.toBeInTheDocument()
  })

  it("keeps older certificates without a description readable", async () => {
    mocks.findCertificate.mockResolvedValue({ ...certificate, description: null })
    await showCertificate()
    expect(screen.getByText("Awarded in recognition of successful completion of the course requirements.")).toBeInTheDocument()
  })

  it("shows an unknown certificate as not found", async () => {
    mocks.findCertificate.mockResolvedValue(null)
    await showCertificate()
    expect(screen.getByRole("heading", { name: "Credential Not Found" })).toBeInTheDocument()
    expect(screen.queryByText("Valid Certification")).not.toBeInTheDocument()
  })
})
