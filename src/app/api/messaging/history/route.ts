// FILE: src/app/api/messaging/history/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { MessageLog } from '@/models/MessageLog'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    await connectDB()

    const { searchParams } = req.nextUrl
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const channel = searchParams.get('channel')
    const purpose = searchParams.get('purpose')
    const status = searchParams.get('status')

    const query: any = { tenantId: guard.session.user.tenantId }
    if (channel) query.channel = channel
    if (purpose) query.purpose = purpose
    if (status) query.status = status

    const [logs, total] = await Promise.all([
        MessageLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        MessageLog.countDocuments(query),
    ])

    return NextResponse.json({
        success: true,
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
}