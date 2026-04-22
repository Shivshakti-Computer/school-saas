// FILE: src/lib/message/systemEmail.ts
// System emails — NO credit check
// Used for: Registration welcome + Superadmin notifications
// ═══════════════════════════════════════════════════════════

import { resendSendEmail } from './providers/resend'
import { connectDB } from '@/lib/db'
import { MessageLog } from '@/models/MessageLog'

// ── Types ────────────────────────────────────────────────

export interface SystemEmailOptions {
  to: string
  subject: string
  html: string
  fromName?: string
  tenantId?: string        // Optional — school exist karta ho tab
  metadata?: Record<string, any>
}

export interface SystemEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ══════════════════════════════════════════════════════════
// sendSystemEmail
// School welcome email ke liye — tenantId hoga
// MessageLog banta hai (creditsUsed: 0)
// ══════════════════════════════════════════════════════════

export async function sendSystemEmail(
  options: SystemEmailOptions
): Promise<SystemEmailResult> {

  // ── Direct Resend call — no credit check ─────────────
  const result = await resendSendEmail(
    options.to,
    options.subject,
    options.html,
    options.fromName || 'Skolify',
    true   // isHtml: true
  )

  // ── MessageLog — sirf jab tenantId ho ────────────────
  if (options.tenantId) {
    try {
      await connectDB()

      await MessageLog.create({
        tenantId: options.tenantId,
        channel: 'email',
        purpose: 'registration',
        recipient: options.to,
        message: options.subject,
        creditsUsed: 0,
        status: result.success ? 'sent' : 'failed',
        providerMessageId: result.messageId,
        errorMessage: result.error,
        deliveredAt: result.success ? new Date() : undefined,
        metadata: {
          ...options.metadata,
          systemEmail: true,
        },
      })
    } catch (logError) {
      // Non-critical
      console.error('[SYSTEM-EMAIL] Log failed:', logError)
    }
  }

  return result
}

// ══════════════════════════════════════════════════════════
// sendSuperadminEmail
// Superadmin notifications ke liye — no tenantId, no log
// SUPERADMIN_EMAIL env var use karta hai
// ══════════════════════════════════════════════════════════

export async function sendSuperadminEmail(
  subject: string,
  html: string,
): Promise<SystemEmailResult> {

  const superadminEmail = process.env.SUPERADMIN_EMAIL

  if (!superadminEmail) {
    console.error('[SYSTEM-EMAIL] ⚠️ SUPERADMIN_EMAIL not set in env')
    return {
      success: false,
      error: 'SUPERADMIN_EMAIL not configured',
    }
  }

  return resendSendEmail(
    superadminEmail,
    subject,
    html,
    'Skolify System',
    true   // isHtml: true
  )
}