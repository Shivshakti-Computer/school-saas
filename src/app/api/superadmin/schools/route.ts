// =============================================================
// FILE: src/app/api/superadmin/schools/route.ts
// GET → all schools list
// =============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const schools = await School.find({})
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ schools })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}