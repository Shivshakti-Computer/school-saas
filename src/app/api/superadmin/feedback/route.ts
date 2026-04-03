// FILE: src/app/api/superadmin/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Feedback } from '@/models/Feedback'

async function guardSuperadmin() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'superadmin') return null
    return session
}

export async function GET(req: NextRequest) {
    if (!await guardSuperadmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

    const filter: any = {}
    if (status) filter.status = status

    const [feedbacks, total] = await Promise.all([
        Feedback.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Feedback.countDocuments(filter),
    ])

    return NextResponse.json({
        success: true,
        feedbacks,
        total,
        pages: Math.ceil(total / limit),
    })
}