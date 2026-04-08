// FILE: src/lib/msg91.ts
// ENHANCED: Add SMS cost tracking and better error handling

import mongoose from 'mongoose'

const MSG91_BASE = 'https://control.msg91.com/api/v5'

// ══════════════════════════════════════════════
// Configuration Getters
// ══════════════════════════════════════════════

function getAuthKey(): string {
    return process.env.MSG91_AUTH_KEY ?? ''
}

function getSenderId(): string {
    return process.env.MSG91_SENDER_ID ?? 'SKOLFY'
}

function getSMSRoute(): string {
    return process.env.MSG91_SMS_ROUTE ?? '4'  // 4 = Transactional
}

function getWhatsAppNumber(): string {
    return process.env.MSG91_WHATSAPP_NUMBER ?? ''
}

function getDomain(): string {
    return process.env.MSG91_EMAIL_DOMAIN ?? process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'skolify.in'
}

// ✅ NEW: Check if SMS enabled
function isSMSEnabled(): boolean {
    return process.env.MSG91_SMS_ENABLED === 'true'
}

// ✅ NEW: Check if WhatsApp enabled
function isWhatsAppEnabled(): boolean {
    return process.env.MSG91_WHATSAPP_ENABLED === 'true'
}

// ── Clean phone number ───
function cleanPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|0091|91|0)/, '')
    return `91${cleaned}`
}

// ✅ NEW: Cost calculation helper
function calculateSMSCost(count: number, type: 'otp' | 'transactional' | 'promotional' = 'transactional'): number {
    const rates = {
        otp: 0.25,
        transactional: 0.25,
        promotional: 0.20,
    }
    return count * rates[type]
}

// ═══════════════════════════════════════════════════════════
// EMAIL (Keep as is - already working)
// ═══════════════════════════════════════════════════════════

// ... your existing email functions (no changes needed) ...

export interface EmailResult {
    success: boolean
    messageId?: string
    error?: string
}

export async function msg91SendEmail(
    to: string,
    subject: string,
    html: string,
    options?: {
        from?: string
        fromName?: string
        replyTo?: string
    }
): Promise<EmailResult> {
    // ... keep your existing implementation ...
    const authKey = getAuthKey()
    const domain = getDomain()

    if (!authKey) {
        console.log(`[MSG91-EMAIL-DEV] To: ${to}`)
        return { success: true, messageId: `dev_email_${Date.now()}` }
    }

    try {
        const fromEmail = options?.from ?? `noreply@${domain}`
        const fromName = options?.fromName ?? 'Skolify'

        const payload = {
            from: { name: fromName, email: fromEmail },
            to: [{ email: to }],
            subject,
            html,
            ...(options?.replyTo && { reply_to: [{ email: options.replyTo }] }),
        }

        const res = await fetch('https://api.msg91.com/api/v5/email/send', {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (data.type === 'success' || data.status === 'success' || res.ok) {
            return {
                success: true,
                messageId: data.message_id ?? data.id ?? `email_${Date.now()}`,
            }
        }

        console.error('[MSG91-EMAIL] Error:', data)
        return { success: false, error: data.message ?? data.error ?? 'Email send failed' }

    } catch (err: any) {
        console.error('[MSG91-EMAIL] Exception:', err)
        return { success: false, error: err?.message ?? 'Email send failed' }
    }
}

export async function msg91SendBulkEmail(
    recipients: Array<{ email: string; name?: string }>,
    subject: string,
    html: string,
    options?: { fromName?: string }
): Promise<EmailResult> {
    // ... keep your existing implementation ...
    const authKey = getAuthKey()
    const domain = getDomain()

    if (!authKey) {
        console.log(`[MSG91-BULK-EMAIL-DEV] Recipients: ${recipients.length}`)
        return { success: true, messageId: `dev_bulk_email_${Date.now()}` }
    }

    try {
        const payload = {
            from: { name: options?.fromName ?? 'Skolify', email: `noreply@${domain}` },
            to: recipients.map(r => ({ email: r.email, ...(r.name && { name: r.name }) })),
            subject,
            html,
        }

        const res = await fetch('https://api.msg91.com/api/v5/email/send', {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (data.type === 'success' || res.ok) {
            return { success: true, messageId: data.message_id ?? `bulk_${Date.now()}` }
        }

        return { success: false, error: data.message ?? 'Bulk email failed' }

    } catch (err: any) {
        console.error('[MSG91-BULK-EMAIL] Exception:', err)
        return { success: false, error: err?.message }
    }
}

// ═══════════════════════════════════════════════════════════
// SMS - ENHANCED with better error handling & cost tracking
// ═══════════════════════════════════════════════════════════

export interface SMSResult {
    success: boolean
    messageId?: string
    error?: string
    cost?: number  // ✅ NEW: Track cost per message
}

export async function msg91SendSMS(
    phone: string | string[],
    message: string,
    templateId?: string
): Promise<SMSResult> {
    const authKey = getAuthKey()

    // ✅ Check if SMS enabled
    if (!isSMSEnabled() || !authKey) {
        const phoneList = Array.isArray(phone) ? phone.join(', ') : phone
        console.log(`[MSG91-SMS-DEV] To: ${phoneList}`)
        console.log(`[MSG91-SMS-DEV] Msg: ${message.slice(0, 80)}`)
        return { success: true, messageId: `dev_${Date.now()}`, cost: 0 }
    }

    try {
        const phones = Array.isArray(phone) ? phone : [phone]
        const cleanedPhones = phones.map(cleanPhone)

        // ✅ Validate phone numbers
        for (const p of cleanedPhones) {
            if (!p || p.length < 10) {
                console.error(`[MSG91-SMS] Invalid phone: ${p}`)
                return {
                    success: false,
                    error: 'Invalid phone number format',
                    cost: 0,
                }
            }
        }

        const numbers = cleanedPhones.join(',')
        const estimatedCost = calculateSMSCost(cleanedPhones.length, 'transactional')

        console.log(`[MSG91-SMS] Sending to ${cleanedPhones.length} recipient(s)`)
        console.log(`[MSG91-SMS] Phone: ${numbers}`)
        console.log(`[MSG91-SMS] Message: ${message.slice(0, 50)}...`)
        console.log(`[MSG91-SMS] Estimated cost: ₹${estimatedCost.toFixed(2)}`)

        // ✅ FIXED: Use correct API endpoint and parameters
        const url = new URL('https://control.msg91.com/api/v5/flow/')

        const payload = {
            flow_id: templateId || undefined,  // Optional template
            sender: getSenderId() || '456789',  // Default sender if not set
            mobiles: numbers,
            authkey: authKey,
            // ✅ For non-template SMS (fallback)
            ...((!templateId) && {
                route: getSMSRoute(),
                message: message,
                unicode: '0',
                flash: '0',
            }),
        }

        console.log('[MSG91-SMS] Request payload:', {
            ...payload,
            authkey: authKey.slice(0, 10) + '...',
            message: message.slice(0, 30) + '...',
        })

        // ✅ Try Flow API first (recommended by MSG91)
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const contentType = res.headers.get('content-type')
        let data: any

        // ✅ Handle different response types
        if (contentType?.includes('application/json')) {
            data = await res.json()
            console.log('[MSG91-SMS] JSON Response:', data)

            // ✅ Check for success in different response formats
            if (
                data.type === 'success' ||
                data.message === 'success' ||
                data.status === 'success'
            ) {
                const msgId = data.request_id || data.message_id || `sms_${Date.now()}`
                console.log(`[MSG91-SMS] ✅ Success - Message ID: ${msgId}`)
                return {
                    success: true,
                    messageId: msgId,
                    cost: estimatedCost,
                }
            }

            // Error response
            const errorMsg = data.message || data.error || data.description || 'SMS send failed'
            console.error('[MSG91-SMS] ❌ API Error:', errorMsg)
            console.error('[MSG91-SMS] Full response:', JSON.stringify(data, null, 2))

            return {
                success: false,
                error: errorMsg,
                cost: 0,
            }
        } else {
            // Text response (old API format)
            const text = await res.text()
            console.log('[MSG91-SMS] Text Response:', text)

            // ✅ Check if hex string (error case)
            if (/^[0-9a-f]+$/i.test(text) && text.length > 20) {
                console.error('[MSG91-SMS] ❌ Got hex response (auth error):', text)

                // Try to decode
                try {
                    const decoded = Buffer.from(text, 'hex').toString('utf8')
                    console.error('[MSG91-SMS] Decoded:', decoded)
                } catch (e) {
                    console.error('[MSG91-SMS] Could not decode hex')
                }

                return {
                    success: false,
                    error: 'Authentication failed. Check MSG91 auth key and sender ID.',
                    cost: 0,
                }
            }

            // Check for success in text response
            if (text.includes('success') || text.startsWith('success')) {
                const msgId = text.split('-')[1]?.trim() || text.split('|')[1]?.trim() || `sms_${Date.now()}`
                console.log(`[MSG91-SMS] ✅ Success - Message ID: ${msgId}`)
                return {
                    success: true,
                    messageId: msgId,
                    cost: estimatedCost,
                }
            }

            // Text error
            console.error('[MSG91-SMS] ❌ Text Error:', text)
            return {
                success: false,
                error: text || 'SMS send failed',
                cost: 0,
            }
        }

    } catch (err: any) {
        console.error('[MSG91-SMS] Exception:', err)
        console.error('[MSG91-SMS] Stack:', err.stack)
        return {
            success: false,
            error: err?.message ?? 'SMS send failed',
            cost: 0,
        }
    }
}

// ✅ ENHANCED: Bulk SMS with better tracking
export interface BulkSMSResult {
    success: boolean
    requestId?: string
    total: number
    error?: string
    cost?: number  // ✅ NEW
}

export async function msg91SendBulkSMS(
    recipients: Array<{ phone: string; message?: string }>,
    defaultMessage: string,
    templateId?: string
): Promise<BulkSMSResult> {
    const authKey = getAuthKey()

    if (!isSMSEnabled() || !authKey) {
        console.log(`[MSG91-BULK-SMS-DEV] Recipients: ${recipients.length}`)
        return {
            success: true,
            requestId: `dev_bulk_${Date.now()}`,
            total: recipients.length,
            cost: 0,
        }
    }

    try {
        const estimatedCost = calculateSMSCost(recipients.length, 'transactional')

        console.log(`[MSG91-BULK-SMS] Sending to ${recipients.length} recipients`)
        console.log(`[MSG91-BULK-SMS] Estimated cost: ₹${estimatedCost.toFixed(2)}`)

        const payload = {
            sender: getSenderId(),
            route: getSMSRoute(),
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
            console.log(`[MSG91-BULK-SMS] ✅ Success - Request ID: ${data.request_id}`)
            return {
                success: true,
                requestId: data.request_id,
                total: recipients.length,
                cost: estimatedCost,
            }
        }

        console.error('[MSG91-BULK-SMS] ❌ Failed:', data.message)
        return {
            success: false,
            error: data.message,
            total: recipients.length,
            cost: 0,
        }

    } catch (err: any) {
        console.error('[MSG91-BULK-SMS] Exception:', err)
        return {
            success: false,
            error: err?.message,
            total: recipients.length,
            cost: 0,
        }
    }
}

// ═══════════════════════════════════════════════════════════
// WHATSAPP - ENHANCED with template support
// ═══════════════════════════════════════════════════════════

export interface WhatsAppResult {
    success: boolean
    messageId?: string
    error?: string
    cost?: number  // ✅ NEW
}

export async function msg91SendWhatsApp(
    phone: string,
    message: string,
    templateId?: string,
    params?: string[]
): Promise<WhatsAppResult> {
    const authKey = getAuthKey()
    const waNumber = getWhatsAppNumber()

    // ✅ Check if WhatsApp enabled
    if (!isWhatsAppEnabled() || !authKey || !waNumber) {
        console.log(`[MSG91-WA-DEV] To: ${phone}`)
        console.log(`[MSG91-WA-DEV] Template: ${templateId ?? 'none'}`)
        console.log(`[MSG91-WA-DEV] Msg: ${message.slice(0, 80)}`)
        return { success: true, messageId: `dev_wa_${Date.now()}`, cost: 0 }
    }

    try {
        const cleanedPhone = cleanPhone(phone)
        const estimatedCost = 0.30  // WhatsApp cost per message

        console.log(`[MSG91-WA] Sending WhatsApp to ${cleanedPhone}`)
        console.log(`[MSG91-WA] Template: ${templateId || 'None'}`)
        console.log(`[MSG91-WA] Estimated cost: ₹${estimatedCost.toFixed(2)}`)

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
            console.log(`[MSG91-WA] ✅ Success - ID: ${data.request_id || data.id}`)
            return {
                success: true,
                messageId: data.request_id ?? data.id ?? `wa_${Date.now()}`,
                cost: estimatedCost,
            }
        }

        console.error('[MSG91-WA] ❌ Failed:', data)
        return {
            success: false,
            error: data.message ?? data.error ?? 'WhatsApp send failed',
            cost: 0,
        }

    } catch (err: any) {
        console.error('[MSG91-WA] Exception:', err)
        return {
            success: false,
            error: err?.message ?? 'WhatsApp send failed',
            cost: 0,
        }
    }
}

// ═══════════════════════════════════════════════════════════
// OTP - ENHANCED
// ═══════════════════════════════════════════════════════════

export async function msg91SendOTP(
    phone: string,
    otp: string,
    templateId?: string
): Promise<SMSResult> {
    const authKey = getAuthKey()

    if (!isSMSEnabled() || !authKey) {
        console.log(`[MSG91-OTP-DEV] Phone: ${phone}, OTP: ${otp}`)
        return { success: true, messageId: `dev_otp_${Date.now()}`, cost: 0 }
    }

    try {
        const cleanedPhone = cleanPhone(phone)
        const estimatedCost = calculateSMSCost(1, 'otp')

        console.log(`[MSG91-OTP] Sending OTP to ${cleanedPhone}`)
        console.log(`[MSG91-OTP] OTP: ${otp}`)
        console.log(`[MSG91-OTP] Cost: ₹${estimatedCost.toFixed(2)}`)

        const message = `Your Skolify OTP is ${otp}. Valid for 10 minutes. Do not share.`

        // ✅ Use default sender for testing
        const senderId = getSenderId() || 'TXTIND'  // MSG91 default sender

        const params = new URLSearchParams({
            authkey: authKey,
            mobiles: cleanedPhone,
            message: message,
            sender: senderId,  // ✅ Required parameter
            route: '4',
            country: '91',
        })

        console.log('[MSG91-OTP] Request params:', {
            mobiles: cleanedPhone,
            sender: senderId,
            route: '4',
            messageLength: message.length,
        })

        const url = `https://control.msg91.com/api/sendhttp.php?${params.toString()}`

        const res = await fetch(url, { method: 'GET' })
        const text = await res.text()

        console.log('[MSG91-OTP] Response:', text)

        // ✅ Check for hex error
        if (/^[0-9a-f]+$/i.test(text) && text.length > 15) {
            let decoded = 'Unknown error'
            try {
                decoded = Buffer.from(text, 'hex').toString('utf8')
            } catch (e) { }

            console.error('[MSG91-OTP] ❌ Auth error:', decoded)
            return {
                success: false,
                error: `Authentication failed: ${decoded}`,
                cost: 0,
            }
        }

        // ✅ Check for success
        if (text.includes('success') || /^[0-9a-f-]{20,}$/i.test(text)) {
            const msgId = text.replace('success-', '').trim() || `otp_${Date.now()}`
            console.log(`[MSG91-OTP] ✅ Success - Message ID: ${msgId}`)
            return {
                success: true,
                messageId: msgId,
                cost: estimatedCost,
            }
        }

        // ✅ Error response
        console.error('[MSG91-OTP] ❌ Failed:', text)
        return {
            success: false,
            error: text,
            cost: 0,
        }

    } catch (err: any) {
        console.error('[MSG91-OTP] Exception:', err)
        return {
            success: false,
            error: err?.message ?? 'Network error',
            cost: 0,
        }
    }
}

// ═══════════════════════════════════════════════════════════
// DELIVERY STATUS
// ═══════════════════════════════════════════════════════════

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
            { headers: { 'authkey': authKey } }
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

// ✅ NEW: Balance Check
export async function msg91CheckBalance(): Promise<{
    balance: number
    currency: string
    error?: string
}> {
    const authKey = getAuthKey()

    if (!authKey) {
        return { balance: 0, currency: 'INR', error: 'No auth key' }
    }

    try {
        const res = await fetch(
            `https://api.msg91.com/api/balance.php?authkey=${authKey}`,
            { method: 'GET' }
        )

        const text = await res.text()
        const balance = parseFloat(text.replace(/[^0-9.]/g, ''))

        return { balance, currency: 'INR' }

    } catch (err: any) {
        return { balance: 0, currency: 'INR', error: err?.message }
    }
}