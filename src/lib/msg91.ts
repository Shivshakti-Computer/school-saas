// FILE: src/lib/msg91.ts
// MSG91 SDK wrapper — SMS + WhatsApp
// ═══════════════════════════════════════════════════════════

import mongoose from 'mongoose'

const MSG91_BASE = 'https://control.msg91.com/api/v5'

function getAuthKey(): string {
    return process.env.MSG91_AUTH_KEY ?? ''
}

function getSenderId(): string {
    return process.env.MSG91_SENDER_ID ?? 'SKLIFY'
}

function getWhatsAppNumber(): string {
    return process.env.MSG91_WHATSAPP_NUMBER ?? ''
}

// ─── Clean phone number ───
function cleanPhone(phone: string): string {
    // Remove +91, 0, spaces, dashes
    const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0091|91|0)/, '')
    return `91${cleaned}`
}

// ═══════════════════════════════════════
// SMS
// ═══════════════════════════════════════

export interface SMSResult {
    success: boolean
    messageId?: string
    error?: string
}

export async function msg91SendSMS(
    phone: string | string[],
    message: string,
    templateId?: string
): Promise<SMSResult> {
    const authKey = getAuthKey()

    // Dev mode — no API key
    if (!authKey) {
        const phoneList = Array.isArray(phone) ? phone.join(', ') : phone
        console.log(`[MSG91-SMS-DEV] To: ${phoneList}`)
        console.log(`[MSG91-SMS-DEV] Msg: ${message.slice(0, 80)}`)
        return { success: true, messageId: `dev_${Date.now()}` }
    }

    try {
        const phones = Array.isArray(phone) ? phone : [phone]
        const cleanedPhones = phones.map(cleanPhone)

        // ── Template Flow API (preferred for DLT compliance) ──
        if (templateId) {
            const payload = {
                template_id: templateId,
                short_url: '0',
                realTimeResponse: '1',
                recipients: cleanedPhones.map(p => ({
                    mobiles: p,
                    // Add template variables here if needed
                    // name: "Student Name",
                })),
            }

            const res = await fetch(`${MSG91_BASE}/flow/`, {
                method: 'POST',
                headers: {
                    'authkey': authKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (data.type === 'success') {
                return { success: true, messageId: data.request_id }
            }

            console.error('[MSG91-SMS] Flow API error:', data)
            return { success: false, error: data.message ?? 'MSG91 SMS failed' }
        }

        // ── Direct SMS API (fallback) ──
        const numbers = cleanedPhones.join(',')
        const params = new URLSearchParams({
            authkey: authKey,
            mobiles: numbers,
            message: encodeURIComponent(message),
            sender: getSenderId(),
            route: '4',       // 4 = Transactional, 1 = Promotional
            country: '91',
        })

        const res = await fetch(
            `https://api.msg91.com/api/sendhttp.php?${params.toString()}`,
            { method: 'GET' }
        )

        const text = await res.text()

        if (text.startsWith('success') || text.includes('success')) {
            const msgId = text.split('-')[1]?.trim()
            return { success: true, messageId: msgId }
        }

        console.error('[MSG91-SMS] Direct API error:', text)
        return { success: false, error: text }

    } catch (err: any) {
        console.error('[MSG91-SMS] Exception:', err)
        return { success: false, error: err?.message ?? 'SMS send failed' }
    }
}

// ═══════════════════════════════════════
// BULK SMS (Optimized for large lists)
// ═══════════════════════════════════════

export interface BulkSMSResult {
    success: boolean
    requestId?: string
    total: number
    error?: string
}

export async function msg91SendBulkSMS(
    recipients: Array<{ phone: string; message?: string }>,
    defaultMessage: string,
    templateId?: string
): Promise<BulkSMSResult> {
    const authKey = getAuthKey()

    if (!authKey) {
        console.log(`[MSG91-BULK-SMS-DEV] Recipients: ${recipients.length}`)
        return { success: true, requestId: `dev_bulk_${Date.now()}`, total: recipients.length }
    }

    try {
        // MSG91 bulk API format
        const payload = {
            sender: getSenderId(),
            route: '4',
            country: '91',
            sms: recipients.map(r => ({
                message: r.message ?? defaultMessage,
                to: [cleanPhone(r.phone)],
            })),
        }

        const res = await fetch('https://api.msg91.com/api/v2/sendsms', {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (data.type === 'success') {
            return { success: true, requestId: data.request_id, total: recipients.length }
        }

        return { success: false, error: data.message, total: recipients.length }

    } catch (err: any) {
        console.error('[MSG91-BULK-SMS] Exception:', err)
        return { success: false, error: err?.message, total: recipients.length }
    }
}

// ═══════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════

export interface WhatsAppResult {
    success: boolean
    messageId?: string
    error?: string
}

export async function msg91SendWhatsApp(
    phone: string,
    message: string,
    templateId?: string,
    params?: string[]
): Promise<WhatsAppResult> {
    const authKey = getAuthKey()
    const waNumber = getWhatsAppNumber()

    // Dev mode
    if (!authKey || !waNumber) {
        console.log(`[MSG91-WA-DEV] To: ${phone}`)
        console.log(`[MSG91-WA-DEV] Template: ${templateId ?? 'none'}`)
        console.log(`[MSG91-WA-DEV] Msg: ${message.slice(0, 80)}`)
        return { success: true, messageId: `dev_wa_${Date.now()}` }
    }

    try {
        const cleanedPhone = cleanPhone(phone)

        // Build template components
        const components: any[] = []
        if (params && params.length > 0) {
            components.push({
                type: 'body',
                parameters: params.map(p => ({ type: 'text', text: p })),
            })
        }

        const payload = {
            integrated_number: waNumber,
            content_type: 'template',
            payload: {
                messaging_product: 'whatsapp',
                type: 'template',
                template: {
                    name: templateId ?? 'skolify_custom',
                    language: { code: 'en' },
                    ...(components.length > 0 && { components }),
                },
                to: cleanedPhone,
            },
        }

        const res = await fetch(
            `${MSG91_BASE}/whatsapp/whatsapp-outbound-message/bulk/`,
            {
                method: 'POST',
                headers: {
                    'authkey': authKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        )

        const data = await res.json()

        if (
            data.type === 'success' ||
            data.status === 'success' ||
            data.message === 'success'
        ) {
            return {
                success: true,
                messageId: data.request_id ?? data.id ?? `wa_${Date.now()}`,
            }
        }

        console.error('[MSG91-WA] Error:', data)
        return { success: false, error: data.message ?? data.error ?? 'WhatsApp send failed' }

    } catch (err: any) {
        console.error('[MSG91-WA] Exception:', err)
        return { success: false, error: err?.message ?? 'WhatsApp send failed' }
    }
}

// ═══════════════════════════════════════
// OTP
// ═══════════════════════════════════════

export async function msg91SendOTP(
    phone: string,
    otp: string,
    templateId?: string
): Promise<SMSResult> {
    const message = `Your Skolify OTP is ${otp}. Valid for 10 minutes. Do not share. -Skolify`

    // Try OTP API first (MSG91 has dedicated OTP API)
    const authKey = getAuthKey()

    if (!authKey) {
        console.log(`[MSG91-OTP-DEV] Phone: ${phone}, OTP: ${otp}`)
        return { success: true, messageId: `dev_otp_${Date.now()}` }
    }

    try {
        const otpTemplateId = templateId ?? process.env.MSG91_OTP_TEMPLATE_ID

        if (otpTemplateId) {
            // Use MSG91 OTP API
            const params = new URLSearchParams({
                authkey: authKey,
                mobile: cleanPhone(phone),
                message,
                sender: getSenderId(),
                otp,
                template_id: otpTemplateId,
            })

            const res = await fetch(
                `https://api.msg91.com/api/v5/otp?${params.toString()}`,
                { method: 'POST' }
            )
            const data = await res.json()

            if (data.type === 'success') {
                return { success: true, messageId: data.request_id }
            }
        }

        // Fallback to regular SMS
        return msg91SendSMS(phone, message, templateId)

    } catch (err: any) {
        console.error('[MSG91-OTP] Exception:', err)
        return msg91SendSMS(phone, message)
    }
}

// ═══════════════════════════════════════
// DELIVERY STATUS CHECK
// ═══════════════════════════════════════

export interface DeliveryStatus {
    messageId: string
    status: 'delivered' | 'sent' | 'failed' | 'pending'
    error?: string
}

export async function msg91CheckDelivery(
    requestId: string
): Promise<DeliveryStatus> {
    const authKey = getAuthKey()

    if (!authKey || requestId.startsWith('dev_')) {
        return { messageId: requestId, status: 'delivered' }
    }

    try {
        const res = await fetch(
            `${MSG91_BASE}/report/?request_id=${requestId}&type=all`,
            {
                headers: { 'authkey': authKey },
            }
        )
        const data = await res.json()

        if (data.status === 'success' && data.report?.length > 0) {
            const report = data.report[0]
            const statusMap: Record<string, DeliveryStatus['status']> = {
                '1': 'pending',
                '3': 'delivered',
                '9': 'failed',
                '26': 'failed',
            }
            return {
                messageId: requestId,
                status: statusMap[report.status] ?? 'sent',
            }
        }

        return { messageId: requestId, status: 'sent' }

    } catch (err: any) {
        return { messageId: requestId, status: 'sent', error: err?.message }
    }
}