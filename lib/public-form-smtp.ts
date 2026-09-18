import nodemailer from "nodemailer"

/** Public forms and portal email accept the same SMTP password setting. */
export function getPublicFormSmtp() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
  const port = Number(process.env.SMTP_PORT || "587")

  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    return null
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  }
}

export function createPublicFormTransport(smtp: NonNullable<ReturnType<typeof getPublicFormSmtp>>) {
  return nodemailer.createTransport(smtp)
}
