import crypto from 'crypto'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Subscription } from '@/models/Subscription'
import { getPlan } from '@/lib/plans'
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

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            // FIX: planId and billingCycle from body are fallbacks only
            // Primary source is order.notes (set during order creation)
            // This prevents client-side tampering of planId
        } = await req.json()

        // ✅ Signature verify — always first
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expected !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // ✅ Fetch order from Razorpay — source of truth for plan/amount
        // FIX: notes are set in upgrade route as: { newPlanId, billingCycle, baseAmount, type, schoolId }
        const order = await rzp.orders.fetch(razorpay_order_id)
        const notes = order.notes as {
            type?: string
            schoolId?: string
            newPlanId?: string
            billingCycle?: string
            baseAmount?: string
        }

        // FIX: Validate this is actually an upgrade order
        if (notes.type !== 'upgrade') {
            return NextResponse.json(
                { error: 'Invalid order type. Use /api/subscription/verify for fresh subscriptions.' },
                { status: 400 }
            )
        }

        // FIX: Validate schoolId in notes matches session user
        // Prevents one school from verifying another school's order
        if (notes.schoolId !== session.user.tenantId) {
            return NextResponse.json({ error: 'Order does not belong to your account' }, { status: 403 })
        }

        const newPlanId = notes.newPlanId as PlanId
        const billingCycle = notes.billingCycle as BillingCycle
        // FIX: baseAmount is the subtotal (after proration credit, before Razorpay fees)
        // This is what gets stored in Subscription.amount
        const baseAmount = Number(notes.baseAmount)

        if (!newPlanId || !billingCycle || isNaN(baseAmount)) {
            return NextResponse.json({ error: 'Order notes incomplete' }, { status: 400 })
        }

        // Get current active subscription for this tenant
        const currentSub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: 'active',
        })

        // ✅ Apply upgrade
        await applyUpgrade(
            session.user.tenantId,
            newPlanId,
            baseAmount,
            billingCycle,
            currentSub
        )

        return NextResponse.json({
            success: true,
            plan: newPlanId,
            planName: getPlan(newPlanId).name,
        })

    } catch (err: any) {
        console.error('Verify upgrade error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// ─────────────────────────────────────────────────────────────
// applyUpgrade — identical to upgrade route's applyUpgrade
// FIX: Import from upgrade route instead of duplicating
// e.g. import { applyUpgrade } from '../route'
// Kept here for clarity — in production consolidate to shared lib
// ─────────────────────────────────────────────────────────────
async function applyUpgrade(
    tenantId: string,
    newPlanId: PlanId,
    amount: number,
    billing: BillingCycle,
    currentSub: any
) {
    // FIX: Import from '@/lib/subscription' or reuse from upgrade route
    // to avoid code duplication — see comment above
    const { School } = await import('@/models/School')
    const { Subscription } = await import('@/models/Subscription')

    const now = new Date()
    const end = new Date(now)

    if (billing === 'monthly') {
        end.setMonth(end.getMonth() + 1)
    } else {
        end.setFullYear(end.getFullYear() + 1)
    }

    const plan = getPlan(newPlanId)

    if (currentSub) {
        await Subscription.findByIdAndUpdate(currentSub._id, {
            status: 'cancelled',
            cancelledAt: now,
            cancelReason: `Upgraded to ${newPlanId}`,
        })
    }

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

    await School.findByIdAndUpdate(tenantId, {
        plan: newPlanId,
        subscriptionId: newSub._id.toString(),
        modules: plan.modules,
        trialEndsAt: end,
    })
}