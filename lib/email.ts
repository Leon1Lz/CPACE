/**
 * lib/email.ts
 *
 * Email integration service.
 * Supports sending emails via SMTP (Nodemailer), Resend API, or logging to console in development.
 */

import nodemailer, { type Transporter } from "nodemailer"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// SMTP Configuration
const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
const smtpUser = process.env.SMTP_USER
const smtpPassword = process.env.SMTP_PASSWORD
const smtpSecure = process.env.SMTP_SECURE === "true"

const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev"

// Create nodemailer transporter if SMTP_HOST is defined
let transporter: Transporter | null = null
if (smtpHost) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPassword ? {
      user: smtpUser,
      pass: smtpPassword,
    } : undefined,
  })
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  sensitive = false,
}: {
  to: string
  subject: string
  html: string
  text?: string
  sensitive?: boolean
}) {
  try {
    // 1. Prioritize SMTP if SMTP_HOST is configured
    if (transporter) {
      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      })
      return { success: true, messageId: info.messageId }
    }

    // 2. Fall back to Resend API key if RESEND_API_KEY is configured
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        ...(text && { text }),
      })

      if (error) {
        console.error("Resend API Error:", error)
        return { success: false, error }
      }

      return { success: true, data }
    }

    // 3. Fall back to Simulation (Console Logging) in development / local mode
    if (sensitive) {
      console.warn("Sensitive email was not logged because no mail provider is configured.")
      return { success: false, simulated: true }
    }
    console.log(`\n==========================================`)
    console.log(`✉️  EMAIL SIMULATION (No SMTP or Resend configured)`)
    console.log(`👉 To:      ${to}`)
    console.log(`👉 Subject: ${subject}`)
    console.log(`👉 Body:    ${text || "See HTML content"}`)
    console.log(`==========================================\n`)
    return { success: true, simulated: true }
  } catch (err) {
    console.error("Failed to send email:", err)
    return { success: false, error: err }
  }
}


/**
 * 1. Password Reset Email template
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const subject = "Reset Your Password - CPACE Learning Portal"
  const text = `Please use the following link to reset your password: ${resetUrl}. This link is valid for 1 hour.`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; rounded-xl; background: #ffffff;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">
        You are receiving this email because we received a password reset request for your CPACE account.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        This link will expire in 1 hour. If you did not request a password reset, no further action is required.
      </p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        If you're having trouble clicking the button, copy and paste the URL below into your web browser:<br />
        <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
      </p>
    </div>
  `

  return sendEmail({ to: email, subject, html, text, sensitive: true })
}

/**
 * 2. Enrollment Welcome Email template
 */
export async function sendWelcomeEnrollmentEmail({
  email,
  studentName,
  courseTitle,
}: {
  email: string
  studentName: string
  courseTitle: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const dashboardUrl = `${baseUrl}/dashboard`

  const subject = `Enrolled Successfully: ${courseTitle}`
  const text = `Hello ${studentName}, you have been enrolled in the course: ${courseTitle}. Visit your dashboard to start learning: ${dashboardUrl}.`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; rounded-xl; background: #ffffff;">
      <h2 style="color: #10b981; margin-bottom: 16px;">Welcome to Your New Course!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">
        Hello <strong>${studentName}</strong>,
      </p>
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">
        You have been successfully enrolled in the course: <strong>${courseTitle}</strong>.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${dashboardUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
      <p style="color: #475569; font-size: 14px;">
        Enjoy your learning journey! If you have any questions, please reach out to your course instructor.
      </p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        CPACE Professional Learning System
      </p>
    </div>
  `

  return sendEmail({ to: email, subject, html, text })
}
