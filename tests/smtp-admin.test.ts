import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  verify: vi.fn(),
  sendMail: vi.fn(),
  createTransport: vi.fn(),
  audit: vi.fn(),
}))

vi.mock("@/lib/api-auth", () => ({
  requireApiUser: mocks.requireUser,
  apiErrorStatus: () => 500,
  apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}))
vi.mock("@/lib/audit", () => ({ recordStaffAudit: mocks.audit }))
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }))

import { GET, POST } from "@/app/api/admin/smtp/route"

describe("admin SMTP diagnostics", () => {
  beforeEach(() => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com")
    vi.stubEnv("SMTP_PORT", "587")
    vi.stubEnv("SMTP_USER", "mailer@example.com")
    vi.stubEnv("SMTP_PASSWORD", "app-password")
    vi.stubEnv("SMTP_SECURE", "false")
    mocks.requireUser.mockResolvedValue({ id: "admin", role: "ADMIN", email: "admin@example.com", firstName: "Admin", lastName: "User" })
    mocks.verify.mockResolvedValue(true)
    mocks.sendMail.mockResolvedValue({ accepted: ["admin@example.com"], rejected: [] })
    mocks.createTransport.mockReturnValue({ verify: mocks.verify, sendMail: mocks.sendMail })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("reports configuration without returning credentials", async () => {
    const response = await GET()
    const body = await response.json()
    expect(body).toMatchObject({ configured: true, port: 587, secure: false })
    expect(JSON.stringify(body)).not.toContain("app-password")
  })

  it("verifies SMTP and sends the test only to the signed-in administrator", async () => {
    const response = await POST()
    expect(response.status).toBe(200)
    expect(mocks.verify).toHaveBeenCalledOnce()
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "admin@example.com" }))
    expect(mocks.audit).toHaveBeenCalledOnce()
  })

  it("returns unavailable when credentials are incomplete", async () => {
    vi.stubEnv("SMTP_HOST", "")
    const response = await POST()
    expect(response.status).toBe(503)
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })
})
