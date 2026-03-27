// -------------------------------------------------------------
// FIX 2: src/app/api/auth/session-refresh/route.ts — NEW FILE
// POST → school ka fresh data session mein inject karo
// Call this after subscription changes
// -------------------------------------------------------------

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { School } from "@/models/School"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        // Fresh school data fetch karo
        const school = await School.findById(session.user.tenantId)
            .select('plan modules subscriptionId trialEndsAt')
            .lean() as any

        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        // Return fresh data — client will use this to update state
        return NextResponse.json({
            plan: school.plan,
            modules: school.modules,
            subscriptionId: school.subscriptionId,
            trialEndsAt: school.trialEndsAt,
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}