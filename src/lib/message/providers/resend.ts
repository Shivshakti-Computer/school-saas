// FILE: src/lib/message/providers/resend.ts
// UPDATED:
//   - isHtml parameter added
//   - System emails (welcome, otp, receipt) → html as-is
//   - Bulk emails → plain text + simple html wrapper
// ═══════════════════════════════════════════════════════════

import { Resend } from 'resend'

function getConfig() {
    return {
        apiKey: process.env.RESEND_API_KEY ?? '',
        senderEmail: process.env.RESEND_SENDER_EMAIL ?? 'noreply@skolify.in',
        enabled: process.env.RESEND_ENABLED === 'true',
    }
}

export interface ResendResult {
    success: boolean
    messageId?: string
    error?: string
}

// ── Plain text → Simple HTML wrapper ─────────────────────
// Bulk emails ke liye — koi complex styling nahi
// Line breaks handle karo — bas itna kaafi hai
function plainTextToSimpleHtml(text: string): string {
    // HTML special chars escape karo
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // Double line break → paragraph
    // Single line break → <br>
    const withParagraphs = escaped
        .split(/\n\n+/)
        .filter(p => p.trim())
        .map(p =>
            `<p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6">${p.trim().replace(/\n/g, '<br>')
            }</p>`
        )
        .join('')

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:24px 16px;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:28px">
    ${withParagraphs}
    <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      Sent via Skolify School Management System
    </p>
  </div>
</body>
</html>`
}

// ══════════════════════════════════════════════════════════
// Main Send Function
//
// isHtml = false (default) → Bulk communication
//   content = plain text
//   resend ko: text + html (simple wrapper)
//
// isHtml = true → System emails
//   content = full HTML string (welcome, otp, receipt)
//   resend ko: html only
// ══════════════════════════════════════════════════════════

export async function resendSendEmail(
    to: string,
    subject: string,
    content: string,              // plain text ya html string
    fromName: string = 'Skolify',
    isHtml: boolean = false      // ← naya parameter
): Promise<ResendResult> {
    const config = getConfig()

    // ── Dev Mode ───────────────────────────────────────────
    if (!config.enabled || !config.apiKey) {
        console.log(`[RESEND-DEV] To: ${to} | Subject: ${subject}`)
        console.log(
            `[RESEND-DEV] Mode: ${isHtml ? 'HTML' : 'Plain Text'} | ` +
            `Preview: ${content.slice(0, 100)}...`
        )
        return { success: true, messageId: `dev_email_${Date.now()}` }
    }

    try {
        const resend = new Resend(config.apiKey)

        const { data, error } = await resend.emails.send({
            from: `${fromName} <${config.senderEmail}>`,
            to: to,
            subject: subject,

            // ── Content strategy ─────────────────────────────
            ...(isHtml
                ? {
                    // System email — full HTML as-is
                    // (welcome, otp, fee receipt)
                    html: content,
                }
                : {
                    // Bulk plain text email
                    // text = primary (Gmail plain text tab)
                    // html = simple wrapper (HTML tab)
                    text: content,
                    html: plainTextToSimpleHtml(content),
                }
            ),
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, messageId: data?.id }

    } catch (err: any) {
        return {
            success: false,
            error: err?.message ?? 'Email send failed',
        }
    }
}