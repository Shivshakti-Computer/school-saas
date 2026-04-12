// FILE: src/app/api/messaging/send/route.ts
// Manual message send from admin dashboard
// UPDATED: Correct imports + templateId removed from core functions
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { sendMessage, sendBulkMessages } from '@/lib/message'  // ✅ Import add
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
        bulk?: boolean
    }>(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard

    const { body, session } = guard

    // ── Validate ─────────────────────────────────────────────
    if (!body.channel || !body.purpose) {
        return NextResponse.json(
            { error: 'channel and purpose are required' },
            { status: 400 }
        )
    }

    if (!body.recipients?.length) {
        return NextResponse.json(
            { error: 'At least one recipient is required' },
            { status: 400 }
        )
    }

    // ── Bulk Send ─────────────────────────────────────────────
    if (body.bulk || body.recipients.length > 1) {
        const result = await sendBulkMessages({
            tenantId: session.user.tenantId,
            channel: body.channel,
            purpose: body.purpose,
            recipients: body.recipients,   // ✅ templateId nahi — core mein exist nahi karta
            sentBy: session.user.id,
            sentByName: session.user.name,
            subject: body.subject,
        })

        return NextResponse.json({
            success: !result.insufficientCredits,
            data: result,
        })
    }

    // ── Single Send ───────────────────────────────────────────
    const r = body.recipients[0]

    if (!r.recipient || !r.message) {
        return NextResponse.json(
            { error: 'recipient and message are required' },
            { status: 400 }
        )
    }

    const result = await sendMessage({
        tenantId: session.user.tenantId,
        channel: body.channel,
        purpose: body.purpose,
        recipient: r.recipient,
        recipientName: r.recipientName,
        message: r.message,
        subject: body.subject,   // ✅ templateId nahi — core mein exist nahi karta
        sentBy: session.user.id,
        sentByName: session.user.name,
    })

    return NextResponse.json({
        success: result.success,
        data: result,
    })
}