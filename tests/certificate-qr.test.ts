// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import jsQR from "jsqr"
import { PNG } from "pngjs"
import { createCertificateVerification } from "@/lib/certificate-qr"

afterEach(() => vi.unstubAllEnvs())

describe("certificate QR verification", () => {
  it("creates a decodable PNG pointing to the certificate on the configured site", async () => {
    vi.stubEnv("NEXTAUTH_URL", "https://certifications.cpaceph.com/")
    const { verificationUrl, qrCodeDataUrl } = await createCertificateVerification("CPACE-123/ABC #1")
    const png = PNG.sync.read(Buffer.from(qrCodeDataUrl.split(",")[1], "base64"))
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)

    expect(verificationUrl).toBe("https://certifications.cpaceph.com/verify/CPACE-123%2FABC%20%231")
    expect(decoded?.data).toBe(verificationUrl)
    expect(new URL(decoded!.data).pathname.split("/")).toHaveLength(3)
  })

  it("uses the deployment production domain when no auth URL is configured", async () => {
    vi.stubEnv("NEXTAUTH_URL", " ")
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "cpace.example.com")
    const verification = await createCertificateVerification("CPACE-123")
    expect(verification.verificationUrl).toBe("https://cpace.example.com/verify/CPACE-123")
  })

  it("rejects a non-web verification address", async () => {
    vi.stubEnv("NEXTAUTH_URL", "javascript:alert(1)")
    await expect(createCertificateVerification("CPACE-123")).rejects.toThrow("HTTP or HTTPS")
  })
})
