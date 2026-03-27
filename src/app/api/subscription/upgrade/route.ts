import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import {
    getPlan,
    getPrice,
    calculateUpgradeAmount,
    getOrderAmountPaise,
} from '@/lib/plans'
import type { PlanId, BillingCycle } from '@/lib/plans'

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const { newPlanId, billingCycle }: {
            newPlanId: PlanId
            billingCycle: BillingCycle
        } = await req.json()

        // FIX: Validate newPlanId is a known plan
        if (!['starter', 'pro', 'enterprise'].includes(newPlanId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const school = await School.findById(session.user.tenantId)
        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        const currentSub = await Subscription.findOne({
            tenantId: school._id,
            status: 'active',
        }).sort({ createdAt: -1 })

        const newPlanPrice = getPrice(newPlanId, billingCycle)

        let upgrade

        if (currentSub) {
            // FIX: Guard — don't allow downgrade via API even if called directly
            const PLAN_ORDER: PlanId[] = ['starter', 'pro', 'enterprise']
            const currentRank = PLAN_ORDER.indexOf(currentSub.plan)
            const newRank = PLAN_ORDER.indexOf(newPlanId)

            if (newRank <= currentRank) {
                return NextResponse.json(
                    { error: 'Downgrade ya same plan ke liye upgrade nahi ho sakta. Please support se contact karein.' },
                    { status: 400 }
                )
            }

            upgrade = calculateUpgradeAmount(
                currentSub.plan,
                newPlanId,
                billingCycle,
                new Date(currentSub.currentPeriodStart),
                new Date(currentSub.currentPeriodEnd),
            )
        } else {
            // No current active plan → full price (trial/expired case)
            upgrade = {
                newPlanPrice,
                creditAmount: 0,
                subtotal: newPlanPrice,
                gstAmount: 0,
                totalPayable: newPlanPrice,
                daysRemaining: 0,
                dailyRate: 0,
                explanation: 'No active subscription found',
            }
        }

        // FREE UPGRADE — enough credit, no payment needed
        if (upgrade.totalPayable === 0) {
            await applyUpgrade(
                school._id.toString(),
                newPlanId,
                newPlanPrice,
                billingCycle,
                currentSub
            )

            return NextResponse.json({
                success: true,
                noPayment: true,
                explanation: upgrade.explanation,
                // FIX: Include planName so client success screen shows correctly
                planName: getPlan(newPlanId).name,
            })
        }

        // PAID UPGRADE — create Razorpay order
        const receipt = `upg_${school._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`

        const order = await rzp.orders.create({
            // FIX: getOrderAmountPaise takes subtotal (before GST handled internally)
            amount: getOrderAmountPaise(upgrade.subtotal),
            currency: 'INR',
            receipt,
            notes: {
                type: 'upgrade',
                schoolId: school._id.toString(),
                newPlanId,
                billingCycle,
                // FIX: baseAmount = subtotal (what school pays before Razorpay, after credit)
                // verify route reads this as Number(notes.baseAmount) — must match
                baseAmount: String(upgrade.subtotal),
            },
        })

        return NextResponse.json({
            orderId: order.id,
            // FIX: amount is in paise from Razorpay — pass as-is to client for Razorpay SDK
            amount: order.amount,
            currency: order.currency,
            breakdown: {
                ...upgrade,
            },
        })

    } catch (err: any) {
        console.error('Upgrade error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// ─────────────────────────────────────────────────────────────
// applyUpgrade — shared by upgrade route (free) and verify route (paid)
// Exported so verify route can reuse — FIX: previously duplicated
// ─────────────────────────────────────────────────────────────
export async function applyUpgrade(
    tenantId: string,
    newPlanId: PlanId,
    amount: number,
    billing: BillingCycle,
    currentSub: any
) {
    const now = new Date()
    const end = new Date(now)

    if (billing === 'monthly') {
        end.setMonth(end.getMonth() + 1)
    } else {
        end.setFullYear(end.getFullYear() + 1)
    }

    const plan = getPlan(newPlanId)

    // Cancel old subscription
    if (currentSub) {
        await Subscription.findByIdAndUpdate(currentSub._id, {
            status: 'cancelled',
            cancelledAt: now,
            cancelReason: `Upgraded to ${newPlanId}`,
        })
    }

    // Create new subscription
    const newSub = await Subscription.create({
        tenantId,
        razorpaySubId: `upg_${Date.now()}`,
        razorpayCustomerId: tenantId,
        plan: newPlanId,
        billingCycle: billing,
        amount,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: end,
    })

    // Update school record
    await School.findByIdAndUpdate(tenantId, {
        plan: newPlanId,
        subscriptionId: newSub._id.toString(),
        modules: plan.modules,
        trialEndsAt: end,
    })
}