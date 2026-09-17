import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { escapeHtmlText } from "@/lib/sanitize"
import { isSafeImageDataUrl } from "@/lib/authorization"
import { authOptions } from "@/lib/auth"
import { isAllowedAssessmentMaterial } from "@/lib/assessment-upload"

describe("security hardening", () => {
  it("accepts bounded raster data URLs and rejects active or oversized content", () => {
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1024), Buffer.from([0xff, 0xd9])])
    expect(isSafeImageDataUrl(`data:image/jpeg;base64,${jpeg.toString("base64")}`)).toBe(true)
    expect(isSafeImageDataUrl("data:image/jpeg;base64,QQ==")).toBe(false)
    expect(isSafeImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false)
    expect(isSafeImageDataUrl(`data:image/png;base64,${"A".repeat(1024)}`, 16)).toBe(false)
  })

  it("escapes all HTML-significant email-template characters", () => {
    expect(escapeHtmlText(`<img src=x onerror="alert('x')"> &`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp;",
    )
  })

  it("does not return or directly log password-reset credentials", () => {
    const source = readFileSync(join(process.cwd(), "app/api/auth/forgot-password/route.ts"), "utf8")
    const emailSource = readFileSync(join(process.cwd(), "lib/email.ts"), "utf8")
    expect(source).not.toContain("debugUrl")
    expect(source).not.toContain("console.log(`👉 Link:")
    expect(source).toContain('createHash("sha256")')
    expect(emailSource).toContain("if (sensitive)")
    expect(emailSource).not.toContain("ALLOW_INSECURE_EMAIL_SIMULATION")
  })

  it("requires final exams to use a verified active proctoring session", () => {
    const source = readFileSync(join(process.cwd(), "app/api/assessments/[id]/submit/route.ts"), "utf8")
    expect(source).toContain('assessment.type === "FINAL_EXAM"')
    expect(source).toContain("A verified proctored session is required")
    expect(source).toContain('enrollment.status !== "ACTIVE"')
    expect(source).toContain("lastHeartbeatAt")
    expect(source).not.toContain("correctOptionIds")
  })

  it("rejects legacy Office files and generic ZIP files renamed as OOXML", () => {
    const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, ...new Array(32).fill(0)])
    expect(isAllowedAssessmentMaterial(ole, ".doc", "application/msword")).toBe(false)

    const genericZip = Buffer.from("PK\u0003\u0004ordinary-file.txt")
    expect(isAllowedAssessmentMaterial(
      genericZip,
      ".docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )).toBe(false)
  })

  it("turns revoked JWTs into unauthenticated server sessions", async () => {
    const source = readFileSync(join(process.cwd(), "lib/auth.ts"), "utf8")
    expect(source).toContain('token.error = "SessionVerificationFailed"')
    const sessionCallback = authOptions.callbacks?.session as (input: unknown) => Promise<any>
    const revoked = await sessionCallback({
      session: { user: { email: "revoked@example.com" }, expires: new Date(Date.now() + 60_000).toISOString() },
      token: { error: "SessionExpired", userId: "user-1", role: "ADMIN" },
    })
    expect(revoked).toBeNull()

    const active = await sessionCallback({
      session: { user: { email: "active@example.com" }, expires: new Date(Date.now() + 60_000).toISOString() },
      token: { userId: "user-2", role: "LEARNER" },
    })
    expect(active.user.id).toBe("user-2")
  })
})
