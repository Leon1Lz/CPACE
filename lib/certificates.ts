export function getCertificateDescription(description?: string | null): string {
  return description?.trim() || "Awarded in recognition of successful completion of the course requirements."
}

export function getCertificateStatus(
  certificate: { isValid: boolean; expiresAt?: Date | string | null },
  now = new Date(),
): "valid" | "expired" | "revoked" {
  if (!certificate.isValid) return "revoked"
  if (certificate.expiresAt && new Date(certificate.expiresAt) <= now) return "expired"
  return "valid"
}
