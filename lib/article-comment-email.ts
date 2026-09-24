import { sendEmail } from "@/lib/email"
import { escapeHtmlText } from "@/lib/sanitize"

export async function sendArticleCommentEmails({
  articleTitle,
  articleSlug,
  name,
  email,
  comment,
}: {
  articleTitle: string
  articleSlug: string
  name: string
  email: string
  comment: string
}) {
  const recipient = process.env.CONTACT_EMAIL_TO || "info@cpaceph.com"
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
  const articleUrl = `${baseUrl}/insights/${encodeURIComponent(articleSlug)}`
  const safeName = escapeHtmlText(name)
  const safeEmail = escapeHtmlText(email)
  const safeComment = escapeHtmlText(comment)
  const safeTitle = escapeHtmlText(articleTitle)
  const safeUrl = escapeHtmlText(articleUrl)

  const notification = await sendEmail({
    to: recipient,
    replyTo: { name, address: email },
    subject: `[New Article Comment] ${articleTitle}`,
    text: `${name} (${email}) commented on “${articleTitle}”:\n\n${comment}\n\n${articleUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#1e293b">
        <h2 style="color:#047857">New article comment</h2>
        <p><strong>Article:</strong> <a href="${safeUrl}">${safeTitle}</a></p>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <div style="margin-top:18px;padding:16px;border-radius:12px;background:#f8fafc;white-space:pre-wrap">${safeComment}</div>
      </div>
    `,
    sensitive: true,
  })

  let acknowledgment = null
  if (process.env.SEND_AUTO_REPLY === "true") {
    acknowledgment = await sendEmail({
      to: email,
      subject: `Your comment on ${articleTitle}`,
      text: `Hello ${name},\n\nYour comment on “${articleTitle}” has been published.\n\n${articleUrl}\n\nCPACE Philippines`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#1e293b">
          <h2 style="color:#047857">Thank you for joining the conversation</h2>
          <p>Hello <strong>${safeName}</strong>,</p>
          <p>Your comment on <a href="${safeUrl}"><strong>${safeTitle}</strong></a> has been published.</p>
          <p style="color:#64748b">CPACE Philippines</p>
        </div>
      `,
      sensitive: true,
    })
  }

  return { notification, acknowledgment }
}
