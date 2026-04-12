// FILE: src/lib/message/providers/fast2sms.ts
// Fast2SMS provider for SMS & WhatsApp
// ═══════════════════════════════════════════════════════════

const FAST2SMS_BASE = 'https://www.fast2sms.com/dev/bulkV2'

function getConfig() {
    return {
        authKey: process.env.FAST2SMS_AUTH_KEY ?? '',
        senderId: process.env.FAST2SMS_SENDER_ID ?? 'TXTIND',
        smsEnabled: process.env.FAST2SMS_SMS_ENABLED === 'true',
        whatsappEnabled: process.env.FAST2SMS_WHATSAPP_ENABLED === 'true',
    }
}

function cleanPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0091|91|0)/, '')
    return cleaned.length === 10 ? cleaned : phone
}

export interface Fast2SMSResult {
    success: boolean
    messageId?: string
    error?: string
    cost?: number
}

// ── Send SMS ──
export async function fast2smsSendSMS(
    phone: string,
    message: string
): Promise<Fast2SMSResult> {
    const config = getConfig()

    if (!config.smsEnabled || !config.authKey) {
        console.log(`[FAST2SMS-SMS-DEV] To: ${phone}`)
        return { success: true, messageId: `dev_sms_${Date.now()}`, cost: 0 }
    }

    try {
        const cleanedPhone = cleanPhone(phone)
        const params = new URLSearchParams({
            authorization: config.authKey,
            route: 'v3',
            sender_id: config.senderId,
            message: message,
            language: 'english',
            flash: '0',
            numbers: cleanedPhone,
        })

        const res = await fetch(`${FAST2SMS_BASE}?${params.toString()}`)
        const data = await res.json()

        if (data.return === true && data.request_id) {
            return { success: true, messageId: data.request_id, cost: 0.20 }
        }

        return { success: false, error: data.message || 'SMS send failed', cost: 0 }
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Network error', cost: 0 }
    }
}

// ── Send WhatsApp ──
export async function fast2smsSendWhatsApp(
    phone: string,
    message: string
): Promise<Fast2SMSResult> {
    const config = getConfig()

    if (!config.whatsappEnabled || !config.authKey) {
        console.log(`[FAST2SMS-WA-DEV] To: ${phone}`)
        return { success: true, messageId: `dev_wa_${Date.now()}`, cost: 0 }
    }

    try {
        const cleanedPhone = cleanPhone(phone)
        const params = new URLSearchParams({
            authorization: config.authKey,
            route: 'wa',
            message: message,
            numbers: cleanedPhone,
        })

        const res = await fetch(`${FAST2SMS_BASE}?${params.toString()}`)
        const data = await res.json()

        if (data.return === true && data.request_id) {
            return { success: true, messageId: data.request_id, cost: 0.30 }
        }

        return { success: false, error: data.message || 'WhatsApp send failed', cost: 0 }
    } catch (err: any) {
        return { success: false, error: err?.message ?? 'Network error', cost: 0 }
    }
}