// =============================================================
// FILE: src/app/api/subscription/create/route.ts
// POST → school subscription shuru karo (Razorpay)
// =============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Razorpay from 'razorpay'
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
        const { planId, billingCycle }: { planId: PlanId; billingCycle: BillingCycle } = await req.json()

        const plan = getPlan(planId)
        const school = await School.findById(session.user.tenantId)
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

        // Razorpay Order create karo (subscription ke liye pehle payment order)
        const order = await rzp.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `sub_${school._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
            notes: {
                schoolId: school._id.toString(),
                tenantId: school._id.toString(),
                planId,
                billingCycle,
                schoolName: school.name,
            },
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