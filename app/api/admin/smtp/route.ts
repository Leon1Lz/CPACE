import { NextResponse } from "next/server"
import { requireApiUser, apiErrorMessage, apiErrorStatus } from "@/lib/api-auth"
import { recordStaffAudit } from "@/lib/audit"
import { createPublicFormTransport, getPublicFormSmtp } from "@/lib/public-form-smtp"

export async function GET() {
  try {
    await requireApiUser(["ADMIN"])
    const smtp = getPublicFormSmtp()
    return NextResponse.json({
      configured: Boolean(smtp),
      port: smtp?.port ?? null,
      secure: smtp?.secure ?? null,
      senderConfigured: Boolean(process.env.CONTACT_EMAIL_FROM || process.env.EMAIL_FROM || smtp?.auth.user),
      recipientConfigured: Boolean(process.env.CONTACT_EMAIL_TO),
      autoReplyEnabled: process.env.SEND_AUTO_REPLY === "true",
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error, "Unable to read SMTP status") }, { status: apiErrorStatus(error) })
  }
}

export async function POST() {
  try {
    const user = await requireApiUser(["ADMIN"])
    const smtp = getPublicFormSmtp()
    if (!smtp) return NextResponse.json({ error: "SMTP credentials are not configured" }, { status: 503 })

    const transporter = createPublicFormTransport(smtp)
    await transporter.verify()
    const from = process.env.CONTACT_EMAIL_FROM || process.env.EMAIL_FROM || smtp.auth.user
    const delivery = await transporter.sendMail({
      from,
      to: user.email,
      subject: "CPACE SMTP connection test",
      text: "SMTP is configured correctly. This test was sent from the CPACE administration portal.",
      html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2 style="color:#047857">SMTP connection successful</h2><p>This test was sent from the CPACE administration portal.</p></div>`,
    })
    if (!delivery.accepted?.length || delivery.rejected?.length) {
      return NextResponse.json({ error: "The SMTP server connected but rejected the test recipient" }, { status: 502 })
    }
    await recordStaffAudit(user, "SMTP_TEST", `Sent an SMTP test email to ${user.email}`)
    return NextResponse.json({ success: true, message: `Test email sent to ${user.email}` })
  } catch (error) {
    const status = apiErrorStatus(error)
    if (status !== 500) return NextResponse.json({ error: apiErrorMessage(error, "SMTP test failed") }, { status })
    console.error("SMTP connection test failed.")
    return NextResponse.json({ error: "SMTP connection failed. Check the host, port, security mode, username, and app password." }, { status: 502 })
  }
}
