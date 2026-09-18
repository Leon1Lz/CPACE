import { NextResponse } from "next/server"
import { getPublicFormSmtp, createPublicFormTransport } from "@/lib/public-form-smtp"
import { z } from "zod"
import { escapeHtmlText } from "@/lib/sanitize"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

const newsletterSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email().max(254),
}).strict()

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`newsletter:${getClientIp(request)}`, 5, 15 * 60 * 1000)
    if (!limit.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    const { name, email } = newsletterSchema.parse(await request.json())
    const safeName = escapeHtmlText(name || "Not provided")
    const safeEmail = escapeHtmlText(email)

    const smtp = getPublicFormSmtp()
    const recipientEmail = process.env.CONTACT_EMAIL_TO || "info@cpaceph.com"
    const fromEmail = process.env.CONTACT_EMAIL_FROM || smtp?.auth.user || '"CPACE" <noreply@cpaceph.com>'

    if (!smtp) {
      console.warn("Public form delivery is unavailable: SMTP configuration is missing or invalid.")
      return NextResponse.json(
        { error: "We could not send your subscription request. Please contact info@cpaceph.com directly or try again later." },
        { status: 503 },
      )
    }

    const transporter = createPublicFormTransport(smtp)

    const submittedDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      dateStyle: "full",
      timeStyle: "short",
    })

    // 1. Notification to CPACE Team
    const delivery = await transporter.sendMail({
      from: fromEmail,
      to: recipientEmail,
      subject: `[Newsletter Subscriber] ${name || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
            <h2 style="color: #059669; margin-top: 0;">New Newsletter Subscriber</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
            <p><strong>Date:</strong> ${submittedDate} (PHT)</p>
          </div>
        </div>
      `,
    })

    if (!delivery.accepted?.length || delivery.rejected?.length) {
      throw new Error("The mail server did not accept the notification recipient")
    }

    // 2. Welcome auto-reply to Subscriber
    if (process.env.SEND_AUTO_REPLY === "true") {
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: `Welcome to the CPACE Philippines Newsletter`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0;">
                <h2 style="color: #059669; margin-top: 0;">Welcome to CPACE Philippines</h2>
                <p>Hello <strong>${safeName || "there"}</strong>,</p>
                <p>Thank you for subscribing to our official newsletter. You will now receive curated updates on upcoming certifications (CFMS®, CMMS®, COMS®), short courses, webinars, and industry insights.</p>
                <p>Explore our programs anytime at <a href="https://cpaceph.com" style="color: #059669; font-weight: bold;">www.cpaceph.com</a> or view upcoming registration schedules on <a href="https://linktr.ee/cpaceph" style="color: #059669; font-weight: bold;">linktr.ee/cpaceph</a>.</p>
                <br>
                <p>Best regards,<br><strong>CPACE Philippines Team</strong></p>
              </div>
            </div>
          `,
        })
      } catch {
        console.error("Newsletter welcome email failed; the main notification was accepted.")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to our newsletter!",
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid newsletter details" }, { status: 400 })
    console.error("Public form email delivery failed.")
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    )
  }
}
