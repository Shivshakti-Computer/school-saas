/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/schools/me/route.ts
   GET → current school info (for settings page)
   PUT → update school info
   ─────────────────────────────────────────────────────────── */
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const school = await School.findById(session.user.tenantId)
        .select('-subscriptionId')
        .lean()

    return NextResponse.json({ school })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    // Fields admin can update (NOT plan, subscriptionId, trialEndsAt)
    const allowed = ['name', 'address', 'phone', 'email', 'logo', 'theme']
    const update: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) update[key] = body[key]
    }

    const school = await School.findByIdAndUpdate(
        session.user.tenantId,
        { $set: update },
        { new: true }
    )

    return NextResponse.json({ school })
}