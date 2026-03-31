// FILE: src/lib/messaging/email.ts
// Email service using Resend

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'Skolify <noreply@skolify.in>'

interface SendEmailParams {
    to: string | string[]
    subject: string
    html: string
    text?: string
    replyTo?: string
}

export async function sendEmail(params: SendEmailParams): Promise<{
    success: boolean
    messageId?: string
    error?: string
}> {
    try {
        // Dev mode — just log
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
            console.log('📧 [EMAIL DEV MODE]')
            console.log(`   To: ${params.to}`)
            console.log(`   Subject: ${params.subject}`)
            console.log(`   Body: ${params.html.slice(0, 200)}...`)
            return { success: true, messageId: 'dev-mode' }
        }

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: Array.isArray(params.to) ? params.to : [params.to],
            subject: params.subject,
            html: params.html,
            text: params.text,
            replyTo: params.replyTo,
        })

        if (error) {
            console.error('Email send error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, messageId: data?.id }
    } catch (err: any) {
        console.error('Email error:', err)
        return { success: false, error: err.message }
    }
}