import crypto from 'crypto'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
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
        } = await req.json()

        // Signature verify
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expected !== razorpay_signature) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            )
        }

        // Fetch order from Razorpay — source of truth
        const order = await rzp.orders.fetch(razorpay_order_id)
        const notes = order.notes as {
            type?: string
            schoolId?: string
            newPlanId?: string
            billingCycle?: string
            baseAmount?: string
        }

        if (notes.type !== 'upgrade') {
            return NextResponse.json(
                { error: 'Invalid order type.' },
                { status: 400 }
            )
        }

        if (notes.schoolId !== session.user.tenantId) {
            return NextResponse.json(
                { error: 'Order does not belong to your account' },
                { status: 403 }
            )
        }

        const newPlanId = notes.newPlanId as PlanId
        const billingCycle = notes.billingCycle as BillingCycle
        const baseAmount = Number(notes.baseAmount)

        if (!newPlanId || !billingCycle || isNaN(baseAmount)) {
            return NextResponse.json(
                { error: 'Order notes incomplete' },
                { status: 400 }
            )
        }

        const currentSub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: 'active',
        })

        // Apply upgrade
        const now = new Date()
        const end = new Date(now)

        // ← FIX: Exactly 30 or 365 days
        if (billingCycle === 'monthly') {
            end.setDate(end.getDate() + 30)
        } else {
            end.setDate(end.getDate() + 365)
        }

        const plan = getPlan(newPlanId)

        if (currentSub) {
            await Subscription.findByIdAndUpdate(currentSub._id, {
                status: 'cancelled',
                cancelledAt: now,
                cancelReason: `Upgraded to ${newPlanId} (${billingCycle})`,
            })
        }

        const newSub = await Subscription.create({
            tenantId: session.user.tenantId,
            razorpaySubId: `upg_${Date.now()}`,
            razorpayCustomerId: session.user.tenantId,
            plan: newPlanId,
            billingCycle,
            amount: baseAmount,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: end,
        })

        await School.findByIdAndUpdate(session.user.tenantId, {
            plan: newPlanId,
            subscriptionId: newSub._id.toString(),
            modules: plan.modules,
            trialEndsAt: end,
        })

        return NextResponse.json({
            success: true,
            plan: newPlanId,
            planName: plan.name,
        })
    } catch (err: any) {
        console.error('Verify upgrade error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}