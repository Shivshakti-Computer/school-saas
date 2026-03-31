// FILE: src/app/api/subscription/create/route.ts
// UPDATED: Add audit logging, sanitization

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import '@/models/Subscription'
import { getPlan, getPriceBreakdown, getOrderAmountPaise } from '@/lib/plans'
import { logAudit } from '@/lib/audit'
import { sanitizeBody, checkRateLimit, rateLimitResponse } from '@/lib/security'
import type { PlanId, BillingCycle } from '@/lib/plans'

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
    // Rate limit
    const rl = checkRateLimit(req, { windowMs: 60 * 1000, maxRequests: 5, identifier: 'sub-create' })
    if (!rl.allowed) return rateLimitResponse(rl.resetIn)

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const body = sanitizeBody(await req.json())
        const { planId, billingCycle }: { planId: PlanId; billingCycle: BillingCycle } = body

        // Validate
        if (!['starter', 'growth', 'pro', 'enterprise'].includes(planId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }
        if (!['monthly', 'yearly'].includes(billingCycle)) {
            return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
        }

        const plan = getPlan(planId)
        const school = await School.findById(session.user.tenantId)
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
        const breakdown = getPriceBreakdown(price)

        // Razorpay Order
        const order = await rzp.orders.create({
            amount: breakdown.totalAmount * 100,
            currency: 'INR',
            receipt: `sub_${school._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
            notes: {
                type: 'subscription',
                schoolId: school._id.toString(),
                tenantId: school._id.toString(),
                planId,
                billingCycle,
                schoolName: school.name,
                baseAmount: String(price),
            },
        })

        // Audit
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'SUBSCRIPTION_CREATE',
            resource: 'Subscription',
            description: `Subscription order created: ${plan.name} (${billingCycle}) - ₹${breakdown.totalAmount}`,
            metadata: { planId, billingCycle, amount: breakdown.totalAmount, orderId: order.id },
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            schoolName: school.name,
            planName: plan.name,
            planId,
            billingCycle,
        })

    } catch (err: any) {
        console.error('Subscription create error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}