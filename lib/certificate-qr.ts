import QRCode from "qrcode"

export async function createCertificateVerification(certificateNumber: string) {
  const baseUrl = process.env.NEXTAUTH_URL?.trim()
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
    || "https://cpace-three.vercel.app"
  const origin = new URL(baseUrl)
  if (origin.protocol !== "https:" && origin.protocol !== "http:") {
    throw new Error("Certificate verification requires an HTTP or HTTPS site URL")
  }
  const verificationUrl = new URL(`/verify/${encodeURIComponent(certificateNumber)}`, origin.origin).href
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    type: "image/png",
    errorCorrectionLevel: "M",
    margin: 4,
    width: 360,
    color: { dark: "#000000", light: "#ffffff" },
  })

  return { verificationUrl, qrCodeDataUrl }
}
