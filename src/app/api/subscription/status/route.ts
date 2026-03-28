// =============================================================
// FILE: src/app/api/subscription/status/route.ts
// GET → current school ka subscription status
// =============================================================

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

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

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // Find active subscription for billing cycle info
        const activeSub = await Subscription.findOne({
            tenantId: school._id,
            status: 'active',
        })
            .sort({ createdAt: -1 })
            .lean() as any

        const now = new Date()
        const trialEnd = new Date(school.trialEndsAt)
        const isPaid = Boolean(school.subscriptionId) && Boolean(activeSub)
        const isInTrial = !isPaid && trialEnd > now
        const daysLeft = Math.ceil(
            (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        const isExpired = !isInTrial && !isPaid

        return NextResponse.json({
            plan: school.plan,
            isInTrial,
            isPaid,
            isExpired,
            daysLeft: isInTrial ? daysLeft : null,
            // ← FIX: trialEndsAt for TrialBanner countdown
            trialEndsAt: school.trialEndsAt
                ? new Date(school.trialEndsAt).toISOString()
                : null,
            // ← FIX: validTill shows subscription end for paid, trial end for trial
            validTill: isPaid && activeSub?.currentPeriodEnd
                ? new Date(activeSub.currentPeriodEnd).toISOString()
                : trialEnd.toISOString(),
            // ← NEW: billingCycle for frontend cycle change logic
            billingCycle: activeSub?.billingCycle ?? null,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}