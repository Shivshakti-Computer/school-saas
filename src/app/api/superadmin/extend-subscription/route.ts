// FILE: src/app/api/superadmin/extend-subscription/route.ts
// Subscription extend karo (testing ke liye — no Razorpay)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Subscription } from '@/models/Subscription'
import { School } from '@/models/School'
import type { PlanId } from '@/config/pricing'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { tenantId, months = 12 } = body

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
        }

        await connectDB()

        const now = new Date()
        const school = await School.findById(tenantId).lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // Current subscription dhundho
        const activeSub = await Subscription.findOne({
            tenantId,
            status: 'active',
        }).lean() as any

        let newPeriodEnd: Date

        if (activeSub) {
            // ── Existing subscription extend karo ──
            const currentEnd = new Date(activeSub.currentPeriodEnd)
            newPeriodEnd = new Date(currentEnd)
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months)

            await Subscription.findByIdAndUpdate(activeSub._id, {
                $set: {
                    currentPeriodEnd: newPeriodEnd,
                    status: 'active',
                },
            })

            console.log(
                `[SUPERADMIN] Subscription extended: ${tenantId}` +
                ` | from: ${currentEnd.toISOString().split('T')[0]}` +
                ` | to: ${newPeriodEnd.toISOString().split('T')[0]}`
            )

        } else {
            // ── Koi subscription nahi — naya bana do ──
            newPeriodEnd = new Date(now)
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months)

            const newSub = await Subscription.create({
                tenantId,
                plan:               school.plan || 'enterprise',
                billingCycle:       'yearly',
                amount:             0,
                status:             'active',
                currentPeriodStart: now,
                currentPeriodEnd:   newPeriodEnd,
                razorpaySubId:      `manual_${Date.now()}`,
                razorpayCustomerId: tenantId,
                isDemo:             true,
                refundEligible:     false,
            })

            // School me subscriptionId set karo
            await School.findByIdAndUpdate(tenantId, {
                $set: {
                    subscriptionId: newSub._id,
                    plan: school.plan || 'enterprise',
                },
            })

            console.log(
                `[SUPERADMIN] New manual subscription created: ${tenantId}` +
                ` | plan: ${school.plan}` +
                ` | till: ${newPeriodEnd.toISOString().split('T')[0]}`
            )
        }

        return NextResponse.json({
            success:      true,
            tenantId,
            months,
            newPeriodEnd: newPeriodEnd.toISOString(),
            message:      `Subscription extended by ${months} month${months > 1 ? 's' : ''}`,
        })

    } catch (err: any) {
        console.error('[SUPERADMIN] Extend subscription error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}