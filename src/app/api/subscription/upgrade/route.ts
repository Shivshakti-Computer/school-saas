// FILE: src/app/api/subscription/upgrade/route.ts
// UPDATED: Fixed PLAN_ORDER (was missing 'growth'!), added audit

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import {
    getPlan, getPrice, calculateUpgradeAmount, getOrderAmountPaise,
} from '@/lib/plans'
import { logAudit } from '@/lib/audit'
import type { PlanId, BillingCycle } from '@/lib/plans'

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// ✅ FIXED: 'growth' was missing!
const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const { newPlanId, billingCycle }: { newPlanId: PlanId; billingCycle: BillingCycle } = await req.json()

        // ✅ FIXED: Added 'growth' to validation
        if (!['starter', 'growth', 'pro', 'enterprise'].includes(newPlanId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const school = await School.findById(session.user.tenantId)
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        const currentSub = await Subscription.findOne({
            tenantId: school._id,
            status: 'active',
        }).sort({ createdAt: -1 })

        const newPlanPrice = getPrice(newPlanId, billingCycle)

        let upgrade

        if (currentSub) {
            const currentRank = PLAN_ORDER.indexOf(currentSub.plan as PlanId)
            const newRank = PLAN_ORDER.indexOf(newPlanId)
            const currentCycle = currentSub.billingCycle as BillingCycle

            if (newRank < currentRank) {
                return NextResponse.json(
                    { error: 'Plan downgrade allowed nahi hai. Support se contact karein.' },
                    { status: 400 }
                )
            }

            if (newRank === currentRank) {
                if (currentCycle === billingCycle) {
                    return NextResponse.json(
                        { error: 'Aap already isi plan aur cycle pe hain.' },
                        { status: 400 }
                    )
                }
                if (currentCycle === 'yearly' && billingCycle === 'monthly') {
                    return NextResponse.json(
                        { error: 'Yearly se monthly switch nahi ho sakta. Current period end hone ke baad monthly select karein.' },
                        { status: 400 }
                    )
                }
            }

            upgrade = calculateUpgradeAmount(
                currentSub.plan as PlanId,
                newPlanId,
                billingCycle,
                currentCycle,
                new Date(currentSub.currentPeriodStart),
                new Date(currentSub.currentPeriodEnd)
            )
        } else {
            upgrade = {
                newPlanPrice,
                creditAmount: 0,
                subtotal: newPlanPrice,
                gstAmount: 0,
                totalPayable: newPlanPrice,
                daysRemaining: 0,
                dailyRate: 0,
                explanation: 'No active subscription — full price',
            }
        }

        // FREE UPGRADE
        if (upgrade.totalPayable === 0) {
            return NextResponse.json({
                success: true,
                noPayment: true,
                breakdown: upgrade,
                explanation: upgrade.explanation,
                planName: getPlan(newPlanId).name,
            })
        }

        // PAID UPGRADE — Razorpay order
        const receipt = `upg_${school._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`

        const order = await rzp.orders.create({
            amount: getOrderAmountPaise(upgrade.subtotal),
            currency: 'INR',
            receipt,
            notes: {
                type: 'upgrade',
                schoolId: school._id.toString(),
                newPlanId,
                billingCycle,
                baseAmount: String(upgrade.subtotal),
                upgradedFrom: currentSub?.plan || 'none',
            },
        })

        // Audit
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: 'admin',
            action: 'SUBSCRIPTION_UPGRADE',
            resource: 'Subscription',
            description: `Upgrade order: ${currentSub?.plan || 'none'} → ${newPlanId} (${billingCycle}) - ₹${upgrade.totalPayable}`,
            metadata: { from: currentSub?.plan, to: newPlanId, billingCycle, amount: upgrade.totalPayable },
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            breakdown: { ...upgrade },
        })
    } catch (err: any) {
        console.error('Upgrade error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// ─── Shared helper (exported for free upgrade route) ───
export async function applyUpgrade(
    tenantId: string,
    newPlanId: PlanId,
    amount: number,
    billing: BillingCycle,
    currentSub: any,
    paymentInfo?: { razorpayPaymentId: string; razorpayOrderId: string }
) {
    const now = new Date()
    const end = new Date(now)

    if (billing === 'monthly') {
        end.setDate(end.getDate() + 30)
    } else {
        end.setDate(end.getDate() + 365)
    }

    const plan = getPlan(newPlanId)

    if (currentSub) {
        await Subscription.findByIdAndUpdate(currentSub._id, {
            status: 'cancelled',
            cancelledAt: now,
            cancelReason: `Upgraded to ${newPlanId} (${billing})`,
        })
    }

    const invoiceNumber = paymentInfo
        ? `INV-UPG-${Date.now().toString().slice(-8)}`
        : undefined

    const newSub = await Subscription.create({
        tenantId,
        razorpaySubId: paymentInfo?.razorpayPaymentId || `free_upg_${Date.now()}`,
        razorpayCustomerId: tenantId,
        plan: newPlanId,
        billingCycle: billing,
        amount,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: end,
        upgradedFrom: currentSub?.plan,
        lastPaymentAt: paymentInfo ? now : undefined,
        paymentHistory: paymentInfo ? [{
            razorpayPaymentId: paymentInfo.razorpayPaymentId,
            razorpayOrderId: paymentInfo.razorpayOrderId,
            amount,
            currency: 'INR',
            status: 'captured' as const,
            paidAt: now,
            invoiceNumber,
        }] : [],
    })

    await School.findByIdAndUpdate(tenantId, {
        plan: newPlanId,
        subscriptionId: newSub._id.toString(),
        modules: plan.modules,
        trialEndsAt: end,
    })

    return newSub
}