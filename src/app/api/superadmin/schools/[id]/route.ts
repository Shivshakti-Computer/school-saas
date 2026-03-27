// =============================================================
// FILE: src/app/api/superadmin/schools/[id]/route.ts
// PUT → school plan/status change (superadmin only)
// =============================================================

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { PLANS } from '@/lib/plans'
import { School } from '@/models/School'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        await connectDB()
        const body = await req.json()

        const update: any = {}

        if (typeof body.isActive === 'boolean') {
            update.isActive = body.isActive
        }

        if (body.plan && ['starter', 'pro', 'enterprise'].includes(body.plan)) {
            update.plan = body.plan
            update.modules = PLANS[body.plan as keyof typeof PLANS]?.modules ?? []
            // Manual override — set subscriptionId so it doesn't block
            if (body.manualOverride) {
                update.subscriptionId = `manual_${Date.now()}`
            }
        }

        const school = await School.findByIdAndUpdate(id, { $set: update }, { new: true })
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        return NextResponse.json({ school })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}