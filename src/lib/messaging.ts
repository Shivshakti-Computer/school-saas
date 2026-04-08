// FILE: src/lib/messaging.ts
// ═══════════════════════════════════════════════════════════
// SMS_TEMPLATES — sms.ts se import karo, yahan define mat karo
// ═══════════════════════════════════════════════════════════

import { connectDB } from './db'
import { MessageLog } from '@/models/MessageLog'
import { deductCredits, checkCredits } from './credits'
import { sendEmail } from './email'
import { CREDIT_COSTS } from '@/config/pricing'
import type { MessageChannel, MessagePurpose } from '@/models/MessageLog'
import type { CreditType } from '@/config/pricing'
import { msg91SendSMS, msg91SendWhatsApp } from './msg91'

// ✅ Single source of truth — sms.ts se import
export { SMS_TEMPLATES } from './sms'
export type { SMSTemplateResult } from './sms'

// ══════════════════════════════════════════════
// MessageInput — string ya SMSTemplateResult dono
// ══════════════════════════════════════════════

export type MessageInput =
  | string
  | { message: string; templateId?: string }

function resolveMessage(input: MessageInput): {
  message: string
  templateId?: string
} {
  if (typeof input === 'string') {
    return { message: input, templateId: undefined }
  }
  return { message: input.message, templateId: input.templateId }
}

// ══════════════════════════════════════════════
// Interfaces
// ══════════════════════════════════════════════

export interface SendMessageOptions {
  tenantId: string
  channel: MessageChannel
  purpose: MessagePurpose
  recipient: string
  recipientName?: string
  message: MessageInput         // string | { message, templateId }
  subject?: string
  html?: string
  templateId?: string           // override — priority over template's templateId
  templateParams?: string[]
  sentBy?: string
  sentByName?: string
  metadata?: Record<string, any>
  skipCreditCheck?: boolean
}

export interface SendResult {
  success: boolean
  channel: MessageChannel
  creditsUsed: number
  messageLogId?: string
  error?: string
  skipped?: boolean
  skipReason?: string
}

// ══════════════════════════════════════════════
// Main send function
// ══════════════════════════════════════════════

export async function sendMessage(options: SendMessageOptions): Promise<SendResult> {
  await connectDB()

  // ✅ Resolve — string ya object dono handle
  const resolved        = resolveMessage(options.message)
  const finalMessage    = resolved.message
  const finalTemplateId = options.templateId ?? resolved.templateId

  const creditType = options.channel as CreditType
  const creditCost = CREDIT_COSTS[creditType]

  // ── Credit check ──
  if (!options.skipCreditCheck) {
    const creditCheck = await checkCredits(options.tenantId, creditType, 1)
    if (!creditCheck.canSend) {
      const log = await MessageLog.create({
        tenantId:      options.tenantId,
        channel:       options.channel,
        purpose:       options.purpose,
        recipient:     options.recipient,
        recipientName: options.recipientName,
        message:       finalMessage,
        creditsUsed:   0,
        status:        'skipped',
        errorMessage:  creditCheck.message,
        sentBy:        options.sentBy,
        sentByName:    options.sentByName,
        metadata:      options.metadata,
      })
      return {
        success:      false,
        channel:      options.channel,
        creditsUsed:  0,
        messageLogId: log._id.toString(),
        skipped:      true,
        skipReason:   creditCheck.message,
      }
    }
  }

  // ── Log entry ──
  const log = await MessageLog.create({
    tenantId:      options.tenantId,
    channel:       options.channel,
    purpose:       options.purpose,
    recipient:     options.recipient,
    recipientName: options.recipientName,
    message:       finalMessage,
    templateId:    finalTemplateId,
    creditsUsed:   creditCost,
    status:        'queued',
    sentBy:        options.sentBy,
    sentByName:    options.sentByName,
    metadata:      options.metadata,
  })

  let providerResult: { success: boolean; messageId?: string; error?: string }

  // ── Send ──
  try {
    if (options.channel === 'sms') {
      providerResult = await msg91SendSMS(options.recipient, finalMessage, finalTemplateId)
    } else if (options.channel === 'whatsapp') {
      providerResult = await msg91SendWhatsApp(options.recipient, finalMessage, finalTemplateId, options.templateParams)
    } else {
      const subject = options.subject ?? 'Message from your school'
      const html    = options.html    ?? `<p>${finalMessage}</p>`
      providerResult = await sendEmail(options.recipient, subject, html)
    }
  } catch (err: any) {
    providerResult = { success: false, error: err?.message ?? 'Provider error' }
  }

  // ── Update log ──
  await MessageLog.findByIdAndUpdate(log._id, {
    status:            providerResult.success ? 'sent' : 'failed',
    providerMessageId: providerResult.messageId,
    errorMessage:      providerResult.error,
    deliveredAt:       providerResult.success ? new Date() : undefined,
  })

  // ── Deduct credits ──
  if (providerResult.success && !options.skipCreditCheck) {
    await deductCredits(options.tenantId, creditType, 1, options.purpose, log._id.toString())
  }

  return {
    success:      providerResult.success,
    channel:      options.channel,
    creditsUsed:  providerResult.success ? creditCost : 0,
    messageLogId: log._id.toString(),
    error:        providerResult.error,
  }
}

// ══════════════════════════════════════════════
// Bulk send
// ══════════════════════════════════════════════

export interface BulkSendOptions {
  tenantId: string
  channel: MessageChannel
  purpose: MessagePurpose
  recipients: Array<{
    recipient: string
    recipientName?: string
    message: MessageInput     // ✅ dono formats
    templateParams?: string[]
  }>
  templateId?: string
  sentBy?: string
  sentByName?: string
  subject?: string
}

export interface BulkSendResult {
  total: number
  sent: number
  failed: number
  skipped: number
  creditsUsed: number
  insufficientCredits: boolean
}

export async function sendBulkMessages(options: BulkSendOptions): Promise<BulkSendResult> {
  await connectDB()

  const creditType  = options.channel as CreditType
  const creditCheck = await checkCredits(options.tenantId, creditType, options.recipients.length)

  if (!creditCheck.canSend) {
    const logs = options.recipients.map(r => {
      const { message } = resolveMessage(r.message)
      return {
        tenantId:      options.tenantId,
        channel:       options.channel,
        purpose:       options.purpose,
        recipient:     r.recipient,
        recipientName: r.recipientName,
        message,
        creditsUsed:   0,
        status:        'skipped' as const,
        errorMessage:  'Insufficient credits',
        sentBy:        options.sentBy,
        sentByName:    options.sentByName,
      }
    })
    await MessageLog.insertMany(logs)

    return {
      total:               options.recipients.length,
      sent:                0,
      failed:              0,
      skipped:             options.recipients.length,
      creditsUsed:         0,
      insufficientCredits: true,
    }
  }

  const BATCH_SIZE = 50
  let sent = 0, failed = 0, skipped = 0, creditsUsed = 0

  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    const batch = options.recipients.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (r) => {
        const result = await sendMessage({
          tenantId:       options.tenantId,
          channel:        options.channel,
          purpose:        options.purpose,
          recipient:      r.recipient,
          recipientName:  r.recipientName,
          message:        r.message,
          templateId:     options.templateId,
          templateParams: r.templateParams,
          sentBy:         options.sentBy,
          sentByName:     options.sentByName,
          subject:        options.subject,
        })

        if (result.skipped)        skipped++
        else if (result.success) { sent++; creditsUsed += result.creditsUsed }
        else                       failed++
      })
    )

    if (i + BATCH_SIZE < options.recipients.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return { total: options.recipients.length, sent, failed, skipped, creditsUsed, insufficientCredits: false }
}