import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { POST as contact } from "@/app/api/contact/route"
import { POST as newsletter } from "@/app/api/newsletter/route"
import { submitPublicForm } from "@/lib/public-form-client"
import { getPublicFormSmtp } from "@/lib/public-form-smtp"

const mail = vi.hoisted(() => ({ send: vi.fn(), transport: vi.fn() }))
vi.mock("nodemailer", () => ({ default: { createTransport: mail.transport } }))
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => ({ success: true }),
}))

const payload = {
  name: '<img src=x onerror="alert(1)">',
  email: "sender@example.com",
  message: "<script>alert(1)</script>",
}
const request = (body: unknown) => new Request("http://localhost/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

beforeEach(() => {
  vi.stubEnv("SMTP_HOST", "smtp.example.com")
  vi.stubEnv("SMTP_USER", "staff@example.com")
  vi.stubEnv("SMTP_PASS", "")
  vi.stubEnv("SMTP_PASSWORD", "test-password")
  vi.stubEnv("SMTP_PORT", "587")
  vi.stubEnv("SMTP_SECURE", "false")
  vi.stubEnv("SEND_AUTO_REPLY", "false")
  mail.transport.mockReturnValue({ sendMail: mail.send })
  mail.send.mockResolvedValue({ accepted: ["staff@example.com"], rejected: [] })
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe.each([
  ["portal contact", contact, payload],
  ["portal newsletter", newsletter, { name: payload.name, email: payload.email }],
] as const)("%s delivery", (_name, handler, body) => {
  it("returns unavailable without pretending an unsent submission succeeded", async () => {
    vi.stubEnv("SMTP_HOST", "")
    const response = await handler(request(body))
    expect(response.status).toBe(503)
    expect(await response.json()).not.toHaveProperty("success", true)
    expect(mail.send).not.toHaveBeenCalled()
  })

  it("accepts the portal password setting and escapes user HTML", async () => {
    const response = await handler(request(body))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true })
    expect(mail.transport).toHaveBeenCalledWith(expect.objectContaining({
      auth: { user: "staff@example.com", pass: "test-password" },
      connectionTimeout: 10000,
    }))
    const email = mail.send.mock.calls[0][0]
    expect(email.html).toContain("&lt;img")
    expect(email.html).not.toContain(payload.name)
    expect(email.html).not.toContain("<script>alert(1)</script>")
  })

  it("reports failure if the notification recipient is rejected", async () => {
    mail.send.mockResolvedValue({ accepted: [], rejected: ["staff@example.com"] })
    expect((await handler(request(body))).status).toBe(500)
  })

  it("handles malformed JSON and invalid field types as client errors", async () => {
    expect((await handler(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400)
    expect((await handler(request({ ...body, email: ["sender@example.com"] }))).status).toBe(400)
    expect(mail.send).not.toHaveBeenCalled()
  })
})

describe("SMTP configuration", () => {
  it("rejects invalid ports and supports SMTP_PASS with implicit TLS on 465", () => {
    vi.stubEnv("SMTP_PORT", "not-a-port")
    expect(getPublicFormSmtp()).toBeNull()
    vi.stubEnv("SMTP_PORT", "465")
    vi.stubEnv("SMTP_PASS", "landing-password")
    expect(getPublicFormSmtp()).toMatchObject({ secure: true, auth: { pass: "landing-password" } })
  })
})

describe("public form acknowledgement", () => {
  it.each([
    [503, { error: "Delivery unavailable" }],
    [200, { success: true, mock: true }],
    [200, {}],
  ])("rejects unconfirmed responses (%s)", async (status, body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })))
    await expect(submitPublicForm("/api/contact", payload)).rejects.toThrow()
  })

  it("handles HTML error pages with a readable retry message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 })))
    await expect(submitPublicForm("/api/contact", payload)).rejects.toThrow("could not be confirmed")
  })

  it("accepts an explicit successful acknowledgement", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true })))
    await expect(submitPublicForm("/api/contact", payload)).resolves.toBeUndefined()
  })
})
