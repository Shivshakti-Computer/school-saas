// FILE: src/lib/message/providers/msg91.ts
// MSG91 provider for WhatsApp Business API (future)
// ═══════════════════════════════════════════════════════════

export interface MSG91Result {
    success: boolean
    messageId?: string
    error?: string
}

export async function msg91SendWhatsApp(
    phone: string,
    message: string,
    templateId?: string
): Promise<MSG91Result> {
    // TODO: Implement when WhatsApp Business API approved

    console.log('[MSG91-WA] Not implemented yet - use Fast2SMS for now')

    return {
        success: false,
        error: 'MSG91 WhatsApp not configured - using Fast2SMS',
    }
}