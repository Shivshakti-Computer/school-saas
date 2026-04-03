// FILE: src/app/api/superadmin/enquiries/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Enquiry } from '@/models/Enquiry'

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

    const [enquiries, total] = await Promise.all([
        Enquiry.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Enquiry.countDocuments(filter),
    ])

    return NextResponse.json({ success: true, enquiries, total })
}