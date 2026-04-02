// FILE: src/lib/messaging.ts
// Unified send — SMS + WhatsApp + Email with credit check
// ═══════════════════════════════════════════════════════════

import { connectDB } from './db'
import { MessageLog } from '@/models/MessageLog'
import { deductCredits, checkCredits } from './credits'
import { sendEmail } from './email'
import { CREDIT_COSTS, TRIAL_CONFIG } from '@/config/pricing'
import { School } from '@/models/School'
import type { MessageChannel, MessagePurpose } from '@/models/MessageLog'
import type { CreditType } from '@/config/pricing'
import { msg91SendSMS, msg91SendWhatsApp } from './msg91'

export interface SendMessageOptions {
  tenantId: string
  channel: MessageChannel
  purpose: MessagePurpose
  recipient: string
  recipientName?: string
  message: string
  // ── Email specific ──
  subject?: string
  html?: string
  // ── MSG91 specific ──
  templateId?: string
  templateParams?: string[]
  // ── Meta ──
  sentBy?: string
  sentByName?: string
  metadata?: Record<string, any>
  skipCreditCheck?: boolean  // System messages (OTP, confirmations)
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

// ── Main send function ──
export async function sendMessage(options: SendMessageOptions): Promise<SendResult> {
  await connectDB()

  const creditType = options.channel as CreditType
  const creditCost = CREDIT_COSTS[creditType]

  // Check credits (skip for OTP/system)
  if (!options.skipCreditCheck) {
    const creditCheck = await checkCredits(options.tenantId, creditType, 1)
    if (!creditCheck.canSend) {
      // Log as skipped
      const log = await MessageLog.create({
        tenantId: options.tenantId,
        channel: options.channel,
        purpose: options.purpose,
        recipient: options.recipient,
        recipientName: options.recipientName,
        message: options.message,
        creditsUsed: 0,
        status: 'skipped',
        errorMessage: creditCheck.message,
        sentBy: options.sentBy,
        sentByName: options.sentByName,
        metadata: options.metadata,
      })

      return {
        success: false,
        channel: options.channel,
        creditsUsed: 0,
        messageLogId: log._id.toString(),
        skipped: true,
        skipReason: creditCheck.message,
      }
    }
  }

  // Create log entry (queued)
  const log = await MessageLog.create({
    tenantId: options.tenantId,
    channel: options.channel,
    purpose: options.purpose,
    recipient: options.recipient,
    recipientName: options.recipientName,
    message: options.message,
    templateId: options.templateId,
    creditsUsed: creditCost,
    status: 'queued',
    sentBy: options.sentBy,
    sentByName: options.sentByName,
    metadata: options.metadata,
  })

  let providerResult: { success: boolean; messageId?: string; error?: string }

  // ── Send via provider ──
  try {
    if (options.channel === 'sms') {
      providerResult = await msg91SendSMS(
        options.recipient,
        options.message,
        options.templateId
      )
    } else if (options.channel === 'whatsapp') {
      providerResult = await msg91SendWhatsApp(
        options.recipient,
        options.message,
        options.templateId,
        options.templateParams
      )
    } else {
      // Email
      const subject = options.subject ?? 'Message from your school'
      const html = options.html ?? `<p>${options.message}</p>`
      providerResult = await sendEmail(options.recipient, subject, html)
    }
  } catch (err: any) {
    providerResult = { success: false, error: err?.message ?? 'Provider error' }
  }

  // ── Update log ──
  const finalStatus = providerResult.success ? 'sent' : 'failed'
  await MessageLog.findByIdAndUpdate(log._id, {
    status: finalStatus,
    providerMessageId: providerResult.messageId,
    errorMessage: providerResult.error,
    deliveredAt: providerResult.success ? new Date() : undefined,
  })

  // ── Deduct credits if sent ──
  if (providerResult.success && !options.skipCreditCheck) {
    await deductCredits(
      options.tenantId,
      creditType,
      1,
      options.purpose,
      log._id.toString()
    )
  }

  return {
    success: providerResult.success,
    channel: options.channel,
    creditsUsed: providerResult.success ? creditCost : 0,
    messageLogId: log._id.toString(),
    error: providerResult.error,
  }
}

// ── Bulk send (e.g., attendance SMS to all absent students) ──
export interface BulkSendOptions {
  tenantId: string
  channel: MessageChannel
  purpose: MessagePurpose
  recipients: Array<{
    recipient: string
    recipientName?: string
    message: string
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

  const creditType = options.channel as CreditType
  const totalRequired = Math.ceil(options.recipients.length * CREDIT_COSTS[creditType])

  // Pre-check total credits
  const creditCheck = await checkCredits(options.tenantId, creditType, options.recipients.length)

  if (!creditCheck.canSend) {
    // Log all as skipped
    const logs = options.recipients.map(r => ({
      tenantId: options.tenantId,
      channel: options.channel,
      purpose: options.purpose,
      recipient: r.recipient,
      recipientName: r.recipientName,
      message: r.message,
      creditsUsed: 0,
      status: 'skipped' as const,
      errorMessage: 'Insufficient credits',
      sentBy: options.sentBy,
      sentByName: options.sentByName,
    }))
    await MessageLog.insertMany(logs)

    return {
      total: options.recipients.length,
      sent: 0,
      failed: 0,
      skipped: options.recipients.length,
      creditsUsed: 0,
      insufficientCredits: true,
    }
  }

  // Send in batches of 50
  const BATCH_SIZE = 50
  let sent = 0, failed = 0, skipped = 0, creditsUsed = 0

  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    const batch = options.recipients.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (r) => {
        const result = await sendMessage({
          tenantId: options.tenantId,
          channel: options.channel,
          purpose: options.purpose,
          recipient: r.recipient,
          recipientName: r.recipientName,
          message: r.message,
          templateId: options.templateId,
          templateParams: r.templateParams,
          sentBy: options.sentBy,
          sentByName: options.sentByName,
          subject: options.subject,
        })

        if (result.skipped) skipped++
        else if (result.success) { sent++; creditsUsed += result.creditsUsed }
        else failed++
      })
    )

    // Small delay between batches
    if (i + BATCH_SIZE < options.recipients.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return {
    total: options.recipients.length,
    sent,
    failed,
    skipped,
    creditsUsed,
    insufficientCredits: false,
  }
}

// ── SMS Templates (MSG91 style) ──
export const SMS_TEMPLATES = {
  absentAlert: (studentName: string, date: string, schoolName: string) =>
    `${studentName} was ABSENT on ${date} at ${schoolName}. Please contact school if needed. -Skolify`,

  feeReminder: (studentName: string, amount: number, dueDate: string) =>
    `Fee of Rs.${amount} for ${studentName} due on ${dueDate}. Pay online to avoid late fine. -Skolify`,

  feePaid: (studentName: string, amount: number, receiptNo: string) =>
    `Payment Rs.${amount} received for ${studentName}. Receipt: ${receiptNo}. Thank you! -Skolify`,

  examResult: (studentName: string, examName: string) =>
    `${studentName}'s ${examName} result is now available. Login to portal to view. -Skolify`,

  notice: (schoolName: string, title: string) =>
    `${schoolName}: New notice - "${title}". Login to portal for details. -Skolify`,

  admissionApproved: (studentName: string, schoolName: string) =>
    `${studentName}'s admission at ${schoolName} is APPROVED. Visit school for further process. -Skolify`,

  creditLow: (balance: number) =>
    `Skolify Alert: Your message credit balance is low (${balance} credits). Recharge now to continue messaging.`,

  trialEnding: (daysLeft: number) =>
    `Skolify: Your 60-day free trial ends in ${daysLeft} days. Subscribe now at skolify.in to continue.`,
}