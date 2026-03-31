// FILE: src/app/api/messaging/usage/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { checkSMSLimit, MessageUsage } from '@/lib/messaging'
import { apiGuard } from '@/lib/apiGuard'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'superadmin'],
        skipPlanCheck: true,
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard

    try {
        const smsLimit = await checkSMSLimit(session.user.tenantId)

        // Get current month usage
        const month = new Date().toISOString().slice(0, 7)
        const usage = await MessageUsage.findOne({
            tenantId: session.user.tenantId,
            month,
        }).lean() as any

        return NextResponse.json({
            sms: {
                used: smsLimit.used,
                limit: smsLimit.limit,
                remaining: smsLimit.remaining,
                plan: smsLimit.plan,
            },
            email: { used: usage?.emailCount || 0 },
            whatsapp: { used: usage?.whatsappCount || 0 },
            month,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}