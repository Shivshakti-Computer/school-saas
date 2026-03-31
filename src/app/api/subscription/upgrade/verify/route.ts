// FILE: src/app/api/subscription/upgrade/verify/route.ts
// UPDATED: Added audit log, payment history

import crypto from 'crypto'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import  '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getPlan } from '@/lib/plans'
import { applyUpgrade } from '../route'
import { logAudit } from '@/lib/audit'
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
            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: 'admin',
                action: 'PAYMENT_FAILED',
                resource: 'Payment',
                description: 'Upgrade payment signature invalid',
                metadata: { razorpay_order_id },
                ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
                status: 'FAILURE',
            })
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // Fetch order from Razorpay
        const order = await rzp.orders.fetch(razorpay_order_id)
        const notes = order.notes as {
            type?: string
            schoolId?: string
            newPlanId?: string
            billingCycle?: string
            baseAmount?: string
            upgradedFrom?: string
        }

        if (notes.type !== 'upgrade') {
            return NextResponse.json({ error: 'Invalid order type.' }, { status: 400 })
        }

        if (notes.schoolId !== session.user.tenantId) {
            return NextResponse.json({ error: 'Order does not belong to your account' }, { status: 403 })
        }

        const newPlanId = notes.newPlanId as PlanId
        const billingCycle = notes.billingCycle as BillingCycle
        const baseAmount = Number(notes.baseAmount)

        if (!newPlanId || !billingCycle || isNaN(baseAmount)) {
            return NextResponse.json({ error: 'Order notes incomplete' }, { status: 400 })
        }

        const currentSub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: 'active',
        })

        // Apply upgrade with payment info
        const newSub = await applyUpgrade(
            session.user.tenantId,
            newPlanId,
            baseAmount,
            billingCycle,
            currentSub,
            { razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id }
        )

        const plan = getPlan(newPlanId)

        // Audit
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: 'admin',
            action: 'PAYMENT_SUCCESS',
            resource: 'Payment',
            resourceId: newSub._id.toString(),
            description: `Upgrade payment verified: ${notes.upgradedFrom || 'none'} → ${newPlanId} (${billingCycle}) - ₹${baseAmount}`,
            metadata: {
                razorpay_payment_id, razorpay_order_id,
                from: notes.upgradedFrom, to: newPlanId,
                billingCycle, amount: baseAmount,
            },
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
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