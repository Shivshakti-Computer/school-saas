// FILE: src/app/api/messaging/usage/route.ts
// UPDATED: Real data now

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { getCreditStats } from '@/lib/credits'
import { connectDB } from '@/lib/db'
import { MessageLog } from '@/models/MessageLog'
import { CreditTransaction } from '@/models/CreditTransaction'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'superadmin'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    await connectDB()

    const tenantId = guard.session.user.tenantId
    const stats = await getCreditStats(tenantId)

    // Current month stats
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const monthlyByChannel = await MessageLog.aggregate([
        {
            $match: {
                tenantId: new (require('mongoose').Types.ObjectId)(tenantId),
                createdAt: { $gte: monthStart },
                status: { $in: ['sent', 'delivered'] },
            },
        },
        {
            $group: {
                _id: '$channel',
                count: { $sum: 1 },
                credits: { $sum: '$creditsUsed' },
            },
        },
    ])

    // Recent transactions
    const recentTxns = await CreditTransaction.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

    return NextResponse.json({
        success: true,
        data: {
            ...stats,
            monthlyByChannel,
            recentTransactions: recentTxns,
        },
    })
}