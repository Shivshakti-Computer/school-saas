// FILE: src/lib/email-providers.ts
// Multi-provider email system with automatic fallback

import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { msg91SendEmail } from './msg91'

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

export type EmailProvider = 'msg91' | 'resend' | 'gmail'

export interface EmailResult {
    success: boolean
    provider?: EmailProvider
    messageId?: string
    error?: string
    fallbackUsed?: boolean
    attemptedProviders?: EmailProvider[]
}

export interface EmailOptions {
    to: string
    subject: string
    html: string
    fromName?: string
    replyTo?: string
    preferredProvider?: EmailProvider
    skipFallback?: boolean
}

// ══════════════════════════════════════════════
// Provider Configurations
// ══════════════════════════════════════════════

const PROVIDERS_CONFIG = {
    msg91: {
        enabled: process.env.MSG91_ENABLED === 'true',
        authKey: process.env.MSG91_AUTH_KEY,
        senderEmail: process.env.MSG91_SENDER_EMAIL || 'noreply@mail.skolify.in',
        senderName: process.env.MSG91_SENDER_NAME || 'Skolify',
    },
    resend: {
        enabled: process.env.RESEND_ENABLED === 'true',
        apiKey: process.env.RESEND_API_KEY,
        senderEmail: process.env.RESEND_SENDER_EMAIL || 'noreply@email.skolify.in',
    },
    gmail: {
        enabled: process.env.GMAIL_ENABLED === 'true',
        user: process.env.GMAIL_USER,
        password: process.env.GMAIL_APP_PASSWORD,
    },
}

// ══════════════════════════════════════════════
// Individual Provider Functions
// ══════════════════════════════════════════════

// ── MSG91 ──
async function sendViaMSG91(options: EmailOptions): Promise<EmailResult> {
    const config = PROVIDERS_CONFIG.msg91

    if (!config.enabled || !config.authKey || !config.senderEmail) {
        return {
            success: false,
            provider: 'msg91',
            error: 'MSG91 not configured',
        }
    }

    try {
        console.log('[EMAIL-PROVIDER] Attempting MSG91...')

        const result = await msg91SendEmail(
            options.to,
            options.subject,
            options.html,
            {
                fromName: options.fromName || config.senderName,
                replyTo: options.replyTo,
            }
        )

        if (result.success) {
            console.log('[EMAIL-PROVIDER] ✅ MSG91 Success')
        } else {
            console.warn('[EMAIL-PROVIDER] ❌ MSG91 Failed:', result.error)
        }

        return {
            success: result.success,
            provider: 'msg91',
            messageId: result.messageId,
            error: result.error,
        }
    } catch (error: any) {
        console.error('[EMAIL-PROVIDER] MSG91 Exception:', error)
        return {
            success: false,
            provider: 'msg91',
            error: error.message || 'MSG91 error',
        }
    }
}

// ── Resend ──
async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
    const config = PROVIDERS_CONFIG.resend

    if (!config.enabled || !config.apiKey || !config.senderEmail) {
        return {
            success: false,
            provider: 'resend',
            error: 'Resend not configured',
        }
    }

    try {
        console.log('[EMAIL-PROVIDER] Attempting Resend...')

        const resend = new Resend(config.apiKey)

        const { data, error } = await resend.emails.send({
            from: `${options.fromName || 'Skolify'} <${config.senderEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            ...(options.replyTo && { reply_to: options.replyTo }),
        })

        if (error) {
            console.warn('[EMAIL-PROVIDER] ❌ Resend Failed:', error.message)
            return {
                success: false,
                provider: 'resend',
                error: error.message,
            }
        }

        console.log('[EMAIL-PROVIDER] ✅ Resend Success')
        return {
            success: true,
            provider: 'resend',
            messageId: data?.id,
        }
    } catch (error: any) {
        console.error('[EMAIL-PROVIDER] Resend Exception:', error)
        return {
            success: false,
            provider: 'resend',
            error: error.message || 'Resend error',
        }
    }
}

// ── Gmail SMTP ──
async function sendViaGmail(options: EmailOptions): Promise<EmailResult> {
    const config = PROVIDERS_CONFIG.gmail

    if (!config.enabled || !config.user || !config.password) {
        return {
            success: false,
            provider: 'gmail',
            error: 'Gmail not configured',
        }
    }

    try {
        console.log('[EMAIL-PROVIDER] Attempting Gmail...')

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.user,
                pass: config.password,
            },
        })

        const info = await transporter.sendMail({
            from: `${options.fromName || 'Skolify'} <${config.user}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            ...(options.replyTo && { replyTo: options.replyTo }),
        })

        console.log('[EMAIL-PROVIDER] ✅ Gmail Success')
        return {
            success: true,
            provider: 'gmail',
            messageId: info.messageId,
        }
    } catch (error: any) {
        console.error('[EMAIL-PROVIDER] Gmail Exception:', error)
        return {
            success: false,
            provider: 'gmail',
            error: error.message || 'Gmail error',
        }
    }
}

// ══════════════════════════════════════════════
// Smart Multi-Provider Sender with Fallback
// ══════════════════════════════════════════════

export async function sendEmailWithFallback(
    options: EmailOptions
): Promise<EmailResult> {
    const fallbackEnabled = process.env.EMAIL_FALLBACK_ENABLED === 'true'
    const attemptedProviders: EmailProvider[] = []

    // Get provider priority from env
    const priorityString = process.env.EMAIL_PROVIDER_PRIORITY || 'msg91,resend,gmail'
    const providerPriority = priorityString
        .split(',')
        .map(p => p.trim() as EmailProvider)

    // If preferred provider specified, try that first
    let providers = providerPriority
    if (options.preferredProvider) {
        providers = [
            options.preferredProvider,
            ...providerPriority.filter(p => p !== options.preferredProvider),
        ]
    }

    console.log('[EMAIL-FALLBACK] Provider priority:', providers.join(' → '))

    // Try each provider
    for (const provider of providers) {
        attemptedProviders.push(provider)

        console.log(`[EMAIL-FALLBACK] Trying provider: ${provider}`)

        let result: EmailResult

        switch (provider) {
            case 'msg91':
                result = await sendViaMSG91(options)
                break
            case 'resend':
                result = await sendViaResend(options)
                break
            case 'gmail':
                result = await sendViaGmail(options)
                break
            default:
                continue
        }

        if (result.success) {
            console.log(`[EMAIL-FALLBACK] ✅ Email sent successfully via ${provider}`)

            // Log if fallback was used
            if (attemptedProviders.length > 1) {
                console.warn(
                    `[EMAIL-FALLBACK] ⚠️ Fallback was used! Primary provider(s) failed: ${attemptedProviders
                        .slice(0, -1)
                        .join(', ')}`
                )
            }

            return {
                ...result,
                fallbackUsed: attemptedProviders.length > 1,
                attemptedProviders,
            }
        }

        console.warn(`[EMAIL-FALLBACK] ❌ ${provider} failed: ${result.error}`)

        // If fallback disabled, return immediately
        if (!fallbackEnabled || options.skipFallback) {
            console.error('[EMAIL-FALLBACK] Fallback disabled, stopping here')
            return {
                ...result,
                attemptedProviders,
            }
        }

        // Continue to next provider
    }

    // All providers failed
    console.error('[EMAIL-FALLBACK] 🚨 CRITICAL: All email providers failed!')

    // Optional: Alert admin
    if (process.env.EMAIL_ALERT_ADMIN_ON_ALL_FAIL === 'true') {
        console.error('[EMAIL-FALLBACK] TODO: Send admin alert about email failure')
        // Implement admin notification logic here
    }

    return {
        success: false,
        error: 'All email providers failed',
        attemptedProviders,
    }
}

// ══════════════════════════════════════════════
// Backward Compatible Wrapper
// ══════════════════════════════════════════════

export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    options?: {
        fromName?: string
        replyTo?: string
        purpose?: string
    }
): Promise<{ success: boolean; error?: string }> {
    const result = await sendEmailWithFallback({
        to,
        subject,
        html,
        fromName: options?.fromName,
        replyTo: options?.replyTo,
    })

    // Log for monitoring
    if (result.fallbackUsed && process.env.EMAIL_LOG_FAILURES === 'true') {
        console.warn(
            `[EMAIL] Fallback used for: ${options?.purpose || 'unknown'} | ` +
            `To: ${to} | Provider: ${result.provider} | ` +
            `Attempted: ${result.attemptedProviders?.join(' → ')}`
        )
    }

    return {
        success: result.success,
        error: result.error,
    }
}

// ══════════════════════════════════════════════
// Bulk Email
// ══════════════════════════════════════════════

export async function sendBulkEmail(
    recipients: Array<{ email: string; name?: string }>,
    subject: string,
    html: string
): Promise<{ success: boolean; error?: string }> {
    // For bulk, try each recipient with fallback
    const results = await Promise.allSettled(
        recipients.map(recipient =>
            sendEmailWithFallback({
                to: recipient.email,
                subject,
                html,
                fromName: 'Skolify',
            })
        )
    )

    const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.success
    ).length

    const failed = results.length - successful

    console.log(`[BULK-EMAIL] Sent: ${successful}/${results.length} | Failed: ${failed}`)

    return {
        success: failed === 0,
        error: failed > 0 ? `${failed} emails failed` : undefined,
    }
}