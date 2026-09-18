import { NextResponse } from "next/server"
import { getPublicFormSmtp, createPublicFormTransport } from "@/lib/public-form-smtp"
import { z } from "zod"
import { escapeHtmlText } from "@/lib/sanitize"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  program: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(5000),
}).strict()

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`contact:${getClientIp(request)}`, 5, 15 * 60 * 1000)
    if (!limit.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    const { name, email, phone, program, message } = contactSchema.parse(await request.json())
    const safeName = escapeHtmlText(name)
    const safeEmail = escapeHtmlText(email)
    const safePhone = escapeHtmlText(phone || "Not provided")
    const safeProgram = escapeHtmlText(program || "General Inquiry")
    const safeMessage = escapeHtmlText(message)

    const smtp = getPublicFormSmtp()
    const recipientEmail = process.env.CONTACT_EMAIL_TO || "info@cpaceph.com"
    const fromEmail = process.env.CONTACT_EMAIL_FROM || smtp?.auth.user || '"CPACE" <noreply@cpaceph.com>'

    if (!smtp) {
      console.warn("Public form delivery is unavailable: SMTP configuration is missing or invalid.")
      return NextResponse.json(
        { error: "We could not send your inquiry. Please contact info@cpaceph.com directly or try again later." },
        { status: 503 },
      )
    }

    const transporter = createPublicFormTransport(smtp)

    const submittedDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      dateStyle: "full",
      timeStyle: "short",
    })

    // HTML Email Template for CPACE Admissions & Staff
    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
        .header p { margin: 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 28px; }
        .field-group { margin-bottom: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; }
        .field-group:last-child { border-bottom: none; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; margin-bottom: 4px; }
        .value { font-size: 15px; color: #0f172a; font-weight: 500; }
        .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
        .badge { display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid #a7f3d0; }
        .footer { background: #f8fafc; padding: 18px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .reply-btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>New Website Inquiry</h1>
          <p>CPACE Philippines — Official Website Contact Form</p>
        </div>
        <div class="content">
          <div class="field-group">
            <div class="label">Program of Interest</div>
            <div class="value"><span class="badge">${safeProgram}</span></div>
          </div>
          <div class="field-group">
            <div class="label">Sender Name</div>
            <div class="value">${safeName}</div>
          </div>
          <div class="field-group">
            <div class="label">Email Address</div>
            <div class="value"><a href="mailto:${safeEmail}" style="color:#059669;text-decoration:none;">${safeEmail}</a></div>
          </div>
          <div class="field-group">
            <div class="label">Contact Number</div>
            <div class="value">${safePhone}</div>
          </div>
          <div class="field-group">
            <div class="label">Date Received</div>
            <div class="value">${submittedDate} (PHT)</div>
          </div>
          <div class="field-group">
            <div class="label">Message / Inquiry</div>
            <div class="message-box">${safeMessage}</div>
          </div>
          <div style="text-align: center;">
            <a href="mailto:${email}?subject=RE: CPACE Inquiry - ${encodeURIComponent(program || "General Inquiry")}" class="reply-btn">
              Reply to ${safeName}
            </a>
          </div>
        </div>
        <div class="footer">
          Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines)<br>
          Manila • Dubai • <a href="https://cpaceph.com" style="color:#64748b;">www.cpaceph.com</a>
        </div>
      </div>
    </body>
    </html>
    `

    // Send Main Notification Email to CPACE Admissions
    const delivery = await transporter.sendMail({
      from: fromEmail,
      to: recipientEmail,
      replyTo: { name, address: email },
      subject: `[New Inquiry] ${name} — ${program || "General Inquiry"}`,
      text: `New inquiry from ${name} (${email}, ${phone || "No phone"}):\n\nProgram: ${program || "General Inquiry"}\n\nMessage:\n${message}\n\nSubmitted on: ${submittedDate}`,
      html: htmlEmail,
    })

    if (!delivery.accepted?.length || delivery.rejected?.length) {
      throw new Error("The mail server did not accept the notification recipient")
    }

    // Optionally send auto-acknowledgment to sender if SEND_AUTO_REPLY is true
    if (process.env.SEND_AUTO_REPLY === "true") {
      try {
        const acknowledgmentHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 28px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; }
            .content { padding: 28px; font-size: 15px; line-height: 1.6; color: #334155; }
            .footer { background: #f8fafc; padding: 18px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Thank You for Contacting CPACE</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${safeName}</strong>,</p>
              <p>Thank you for reaching out to the <strong>Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines)</strong>.</p>
              <p>We have received your inquiry regarding <strong>${safeProgram}</strong>. One of our admissions advisors or program specialists will review your message and get in touch with you within 24 to 48 hours.</p>
              <p>In the meantime, you can explore our latest certifications, announcements, and registration links at <a href="https://linktr.ee/cpaceph" style="color:#059669; font-weight:600;">linktr.ee/cpaceph</a> or access the <a href="https://certifications.cpaceph.com/login" style="color:#059669; font-weight:600;">Learning Portal</a>.</p>
              <br>
              <p>Best regards,<br><strong>CPACE Philippines Team</strong><br>Admissions & Support</p>
            </div>
            <div class="footer">
              Manila: +63 956 221-2400 • Dubai: +971 50 348 9439<br>
              info@cpaceph.com • www.cpaceph.com
            </div>
          </div>
        </body>
        </html>
        `

        await transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: `We've received your inquiry — CPACE Philippines`,
          text: `Dear ${name},\n\nThank you for reaching out to CPACE Philippines regarding ${program || "our programs"}. Our team will review your message and respond within 24-48 hours.\n\nBest regards,\nCPACE Philippines Team\ninfo@cpaceph.com`,
          html: acknowledgmentHtml,
        })
      } catch {
        console.error("Contact auto-reply failed; the main notification was accepted.")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been submitted and sent successfully.",
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid contact details" }, { status: 400 })
    console.error("Public form email delivery failed.")
    return NextResponse.json(
      {
        error: "Failed to send message. Please try again or contact us directly at info@cpaceph.com.",
      },
      { status: 500 }
    )
  }
}
