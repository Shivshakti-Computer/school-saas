// FILE: src/lib/message/core.ts
// Core messaging logic with credit system
// UPDATED:
//   - Email: plain text directly pass to resend
//   - HTML helpers removed (resend.ts handle karta hai)
//   - Types: html? field removed from BulkSendOptions
//   - Credit calculation fixed (Math.round instead of Math.ceil)
// ═══════════════════════════════════════════════════════════

import { connectDB } from '../db'
import { MessageLog } from '@/models/MessageLog'
import { checkCredits, deductCredits } from '../credits'
import { CREDIT_COSTS } from '@/config/pricing'
import { fast2smsSendSMS, fast2smsSendWhatsApp } from './providers/fast2sms'
import { resendSendEmail } from './providers/resend'
import type { MessageChannel, MessagePurpose } from '@/models/MessageLog'
import type { CreditType } from '@/config/pricing'

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

export interface SendMessageOptions {
    tenantId: string
    channel: MessageChannel
    purpose: MessagePurpose
    recipient: string
    recipientName?: string
    message: string
    subject?: string    // Email subject
    html?: string    // Optional — sirf EMAIL_TEMPLATES ke liye
    // (welcome, otp, feeReceipt — lib/message/templates.ts)
    // Bulk communication mein use nahi hota
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

export interface BulkSendOptions {
    tenantId: string
    channel: MessageChannel
    purpose: MessagePurpose
    recipients: Array<{
        recipient: string
        recipientName?: string
        message: string
        // html field nahi — plain text only for bulk
    }>
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

// ══════════════════════════════════════════════════════════
// Helper
// ══════════════════════════════════════════════════════════

function roundCredits(value: number): number {
    return Math.round(value * 100) / 100
}

// ══════════════════════════════════════════════════════════
// Send Single Message
// ══════════════════════════════════════════════════════════

export async function sendMessage(
    options: SendMessageOptions
): Promise<SendResult> {
    await connectDB()

    const creditType = options.channel as CreditType

    // ✅ CREDIT_COSTS: sms=1, whatsapp=1, email=0.1
    // Math.round — decimal preserve karo
    const creditCost = roundCredits(CREDIT_COSTS[creditType])

    // ── Credit Check ────────────────────────────────────────
    if (!options.skipCreditCheck) {
        const creditCheck = await checkCredits(
            options.tenantId,
            creditType,
            1
        )

        if (!creditCheck.canSend) {
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

    // ── Create Log Entry (queued) ────────────────────────────
    const log = await MessageLog.create({
        tenantId: options.tenantId,
        channel: options.channel,
        purpose: options.purpose,
        recipient: options.recipient,
        recipientName: options.recipientName,
        message: options.message,
        creditsUsed: creditCost,
        status: 'queued',
        sentBy: options.sentBy,
        sentByName: options.sentByName,
        metadata: options.metadata,
    })

    // ── Send via Provider ────────────────────────────────────
    let providerResult: {
        success: boolean
        messageId?: string
        error?: string
    }

    try {
        if (options.channel === 'sms') {
            // ── SMS ───────────────────────────────────────────
            providerResult = await fast2smsSendSMS(
                options.recipient,
                options.message
            )

        } else if (options.channel === 'whatsapp') {
            // ── WhatsApp ──────────────────────────────────────
            providerResult = await fast2smsSendWhatsApp(
                options.recipient,
                options.message
            )

        } else {
            // ── Email ─────────────────────────────────────────
            const subject = options.subject ?? 'Message from your school'

            // Priority:
            // 1. options.html — explicitly diya hua HTML
            //    (sirf lib/message/templates.ts wale use karte hain:
            //     welcome email, OTP, fee receipt)
            // 2. options.message — plain text
            //    (bulk communication page se aata hai)
            //    resend.ts internally simple html wrapper banata hai
            if (options.html) {
                // Explicit HTML — as-is bhejo (system emails)
                providerResult = await resendSendEmail(
                    options.recipient,
                    subject,
                    options.html,          // html string
                    'Skolify',
                    true                   // isHtml flag
                )
            } else {
                // Plain text — bulk communication
                // resend.ts plain text + simple html wrapper banata hai
                providerResult = await resendSendEmail(
                    options.recipient,
                    subject,
                    options.message,       // plain text
                    'Skolify',
                    false                  // isHtml flag
                )
            }
        }

    } catch (err: any) {
        providerResult = {
            success: false,
            error: err?.message ?? 'Provider error',
        }
    }

    // ── Update Log ───────────────────────────────────────────
    await MessageLog.findByIdAndUpdate(log._id, {
        status: providerResult.success ? 'sent' : 'failed',
        providerMessageId: providerResult.messageId,
        errorMessage: providerResult.error,
        deliveredAt: providerResult.success ? new Date() : undefined,
    })

    // ── Deduct Credits (only on success) ────────────────────
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

// ══════════════════════════════════════════════════════════
// Send Bulk Messages
// ══════════════════════════════════════════════════════════

export async function sendBulkMessages(
    options: BulkSendOptions
): Promise<BulkSendResult> {
    await connectDB()

    const creditType = options.channel as CreditType

    // ── Pre-check: enough credits for all? ──────────────────
    const creditCheck = await checkCredits(
        options.tenantId,
        creditType,
        options.recipients.length
    )

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

    // ── Process in Batches ───────────────────────────────────
    const BATCH_SIZE = 50
    let sent = 0
    let failed = 0
    let skipped = 0
    let creditsUsed = 0

    for (
        let i = 0;
        i < options.recipients.length;
        i += BATCH_SIZE
    ) {
        const batch = options.recipients.slice(i, i + BATCH_SIZE)

        await Promise.allSettled(
            batch.map(async r => {
                const result = await sendMessage({
                    tenantId: options.tenantId,
                    channel: options.channel,
                    purpose: options.purpose,
                    recipient: r.recipient,
                    recipientName: r.recipientName,
                    message: r.message,
                    // html nahi — plain text bulk send
                    sentBy: options.sentBy,
                    sentByName: options.sentByName,
                    subject: options.subject,
                })

                if (result.skipped) {
                    skipped++
                } else if (result.success) {
                    sent++
                    creditsUsed += result.creditsUsed
                } else {
                    failed++
                }
            })
        )

        // Rate limiting between batches
        if (i + BATCH_SIZE < options.recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 200))
        }
    }

    // ── Round final total ────────────────────────────────────
    creditsUsed = roundCredits(creditsUsed)

    return {
        total: options.recipients.length,
        sent,
        failed,
        skipped,
        creditsUsed,
        insufficientCredits: false,
    }
}