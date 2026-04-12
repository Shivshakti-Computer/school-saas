// FILE: src/lib/message/providers/aws-ses.ts
// AWS SES provider for Email (future use when schools scale)
// ═══════════════════════════════════════════════════════════

export interface AWSSESResult {
    success: boolean
    messageId?: string
    error?: string
}

export async function awsSesSendEmail(
    to: string,
    subject: string,
    html: string,
    fromName: string = 'Skolify'
): Promise<AWSSESResult> {
    // TODO: Implement when needed (after 100+ schools)

    console.log('[AWS-SES] Not implemented yet - use Resend for now')

    return {
        success: false,
        error: 'AWS SES not configured - using Resend',
    }
}