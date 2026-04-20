// FILE: src/app/api/credits/balance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { getCreditStats } from '@/lib/credits'
import { RATE_LIMITS } from '@/lib/security'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher', 'superadmin'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    try {
        const stats = await getCreditStats(guard.session.user.tenantId)
        return NextResponse.json({ success: true, data: stats })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}