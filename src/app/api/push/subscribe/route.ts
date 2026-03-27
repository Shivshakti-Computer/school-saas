// =============================================================
// FILE: src/app/api/push/subscribe/route.ts
// Save push subscription to DB
// =============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const { subscription } = await req.json()

        await User.findByIdAndUpdate(session.user.id, {
            pushSubscription: JSON.stringify(subscription),
            pushEnabled: true,
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        await User.findByIdAndUpdate(session.user.id, {
            pushSubscription: null,
            pushEnabled: false,
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}