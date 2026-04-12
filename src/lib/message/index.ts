// FILE: src/lib/message/index.ts
// Main messaging API - Clean exports
// ═══════════════════════════════════════════════════════════

// ── Core Functions ──
export { sendMessage, sendBulkMessages } from './core'
export type { SendMessageOptions, SendResult, BulkSendOptions, BulkSendResult } from './core'

// ── Templates ──
export { SMS_TEMPLATES, EMAIL_TEMPLATES, WHATSAPP_TEMPLATES } from './templates'

// ── Re-export types ──
export type { MessageChannel, MessagePurpose } from '@/models/MessageLog'

// ═══════════════════════════════════════════════════════════
// Quick Helper Functions (Backward Compatible)
// ═══════════════════════════════════════════════════════════

import { sendMessage } from './core'
import { SMS_TEMPLATES, EMAIL_TEMPLATES } from './templates'

// ── Send SMS ──
export async function sendSMS(
    tenantId: string,
    phone: string,
    message: string,
    purpose: any = 'custom'
) {
    return sendMessage({
        tenantId,
        channel: 'sms',
        purpose,
        recipient: phone,
        message,
    })
}

// ── Send Email ──
export async function sendEmail(
    tenantId: string,
    email: string,
    subject: string,
    html: string,
    purpose: any = 'custom'
) {
    return sendMessage({
        tenantId,
        channel: 'email',
        purpose,
        recipient: email,
        message: subject,
        subject,
        html,
    })
}

// ── Send WhatsApp ──
export async function sendWhatsApp(
    tenantId: string,
    phone: string,
    message: string,
    purpose: any = 'custom'
) {
    return sendMessage({
        tenantId,
        channel: 'whatsapp',
        purpose,
        recipient: phone,
        message,
    })
}

// ── Send OTP (SMS + Email) ──
export async function sendOTP(
    tenantId: string,
    phone: string,
    email: string | undefined,
    otp: string
) {
    const smsResult = await sendMessage({
        tenantId,
        channel: 'sms',
        purpose: 'otp',
        recipient: phone,
        message: SMS_TEMPLATES.otp(otp),
    })

    if (email) {
        const emailTemplate = EMAIL_TEMPLATES.otp(otp)
        await sendMessage({
            tenantId,
            channel: 'email',
            purpose: 'otp',
            recipient: email,
            message: emailTemplate.subject,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        })
    }

    return smsResult
}