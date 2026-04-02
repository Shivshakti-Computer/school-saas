// FILE: src/app/api/messaging/send/route.ts
// Manual message send from admin dashboard

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { sendMessage, sendBulkMessages } from '@/lib/messaging'
import type { MessageChannel, MessagePurpose } from '@/models/MessageLog'

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        channel: MessageChannel
        purpose: MessagePurpose
        recipients: Array<{
            recipient: string
            recipientName?: string
            message: string
        }>
        subject?: string
        templateId?: string
        bulk?: boolean
    }>(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard

    const { body, session } = guard

    if (body.bulk || body.recipients.length > 1) {
        const result = await sendBulkMessages({
            tenantId: session.user.tenantId,
            channel: body.channel,
            purpose: body.purpose,
            recipients: body.recipients,
            templateId: body.templateId,
            sentBy: session.user.id,
            sentByName: session.user.name,
            subject: body.subject,
        })
        return NextResponse.json({ success: true, data: result })
    }

    const r = body.recipients[0]
    const result = await sendMessage({
        tenantId: session.user.tenantId,
        channel: body.channel,
        purpose: body.purpose,
        recipient: r.recipient,
        recipientName: r.recipientName,
        message: r.message,
        subject: body.subject,
        templateId: body.templateId,
        sentBy: session.user.id,
        sentByName: session.user.name,
    })

    return NextResponse.json({ success: result.success, data: result })
}