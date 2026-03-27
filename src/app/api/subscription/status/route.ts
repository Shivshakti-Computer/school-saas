// =============================================================
// FILE: src/app/api/subscription/status/route.ts
// GET → current school ka subscription status
// =============================================================

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { School } from "@/models/School"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const school = await School.findById(session.user.tenantId)
            .select('plan trialEndsAt subscriptionId isActive')
            .lean() as any

        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        const now = new Date()
        const trialEnd = new Date(school.trialEndsAt)
        const isInTrial = !school.subscriptionId && trialEnd > now
        const isPaid = Boolean(school.subscriptionId)
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const isExpired = !isInTrial && !isPaid

        return NextResponse.json({
            plan: school.plan,
            isInTrial,
            isPaid,
            isExpired,
            daysLeft: isInTrial ? daysLeft : null,
            validTill: trialEnd.toISOString(),
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}