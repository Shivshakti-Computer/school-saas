// FILE: src/app/api/subscription/upgrade/free/route.ts
// NEW: Handle free upgrades (when credit covers the full amount)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getPlan, calculateUpgradeAmount } from '@/lib/plans'
import { applyUpgrade } from '../route'
import { logAudit } from '@/lib/audit'
import type { PlanId, BillingCycle } from '@/lib/plans'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const { newPlanId, billingCycle }: { newPlanId: PlanId; billingCycle: BillingCycle } = await req.json()

        if (!['starter', 'growth', 'pro', 'enterprise'].includes(newPlanId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const school = await School.findById(session.user.tenantId)
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        const currentSub = await Subscription.findOne({
            tenantId: school._id,
            status: 'active',
        }).sort({ createdAt: -1 })

        if (!currentSub) {
            return NextResponse.json({ error: 'No active subscription to upgrade from' }, { status: 400 })
        }

        // Verify it's actually free
        const upgrade = calculateUpgradeAmount(
            currentSub.plan as PlanId,
            newPlanId,
            billingCycle,
            currentSub.billingCycle as BillingCycle,
            new Date(currentSub.currentPeriodStart),
            new Date(currentSub.currentPeriodEnd)
        )

        if (upgrade.totalPayable > 0) {
            return NextResponse.json(
                { error: 'This upgrade requires payment. Use the payment flow instead.' },
                { status: 400 }
            )
        }

        // Apply free upgrade
        const newSub = await applyUpgrade(
            school._id.toString(),
            newPlanId,
            0,
            billingCycle,
            currentSub
        )

        // Audit
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: 'admin',
            action: 'SUBSCRIPTION_UPGRADE',
            resource: 'Subscription',
            resourceId: newSub._id.toString(),
            description: `Free upgrade: ${currentSub.plan} → ${newPlanId} (${billingCycle}) — credit covered full amount`,
            metadata: {
                from: currentSub.plan,
                to: newPlanId,
                billingCycle,
                creditAmount: upgrade.creditAmount,
            },
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            success: true,
            planName: getPlan(newPlanId).name,
        })

    } catch (err: any) {
        console.error('Free upgrade error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}