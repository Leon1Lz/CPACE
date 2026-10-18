import type { Instrumentation } from "next"

let captured = false

// Temporary diagnostic for the failing certificate HTML render only.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || captured
    || request.path.split("?")[0] !== "/verify/CPACE-DEPLOYMENT-CHECK") return

  captured = true
  const errors: Array<{ name: string; message: string; stack: string; code?: string }> = []
  let current: unknown = error
  const redact = (text: string) => text.replace(/postgres(?:ql)?:\/\/[^\s'"`]+/gi, "[database URL redacted]").slice(0, 6000)
  while (current instanceof Error && errors.length < 3) {
    const coded = current as Error & { code?: string }
    errors.push({ name: current.name, message: redact(current.message), stack: redact(current.stack ?? ""), code: coded.code })
    current = current.cause
  }

  try {
    const { prisma } = await import("./lib/prisma")
    await prisma.auditLog.create({ data: {
      action: "CERTIFICATE_VERIFY_DIAGNOSTIC_20261018",
      category: "SYSTEM",
      actorName: "Certificate verification diagnostic",
      details: JSON.stringify({ renderSource: context.renderSource, routePath: context.routePath, errors }),
    } })
  } catch {
    captured = false
  }
}
