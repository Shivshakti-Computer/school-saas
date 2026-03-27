// -------------------------------------------------------------
// FIX 1: src/app/api/subscription/verify/route.ts
// Payment verify hone ke baad session ko force-refresh karo
// Problem: JWT mein purana plan stored rahta hai, new plan reflect nahi hota
// Solution: next-auth session invalidate karo + fresh data return karo
// -------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getPlan } from '@/lib/plans'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'
import crypto from 'crypto'
import type { PlanId, BillingCycle } from '@/lib/plans'

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
            planId,
            billingCycle,
        } = await req.json()

        // Signature verify
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (expectedSig !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }

        const plan = getPlan(planId as PlanId)
        const school = await School.findById(session.user.tenantId)
        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        const now = new Date()
        const end = new Date(now)
        if ((billingCycle as BillingCycle) === 'monthly') {
            end.setMonth(end.getMonth() + 1)
        } else {
            end.setFullYear(end.getFullYear() + 1)
        }

        const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

        const subscription = await Subscription.create({
            tenantId: school._id,
            razorpaySubId: razorpay_payment_id,
            razorpayCustomerId: session.user.id,
            plan: planId,
            billingCycle,
            amount,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: end,
        })

        // School update karo
        await School.findByIdAndUpdate(school._id, {
            plan: planId,
            subscriptionId: subscription._id.toString(),
            modules: plan.modules,
            trialEndsAt: end,
        })

        if (school.email) {
            const { subject, html } = EMAIL_TEMPLATES.paymentConfirm(
                school.name, amount, plan.name
            )
            await sendEmail(school.email, subject, html).catch(console.error)
        }

        // *** KEY FIX: Tell client to force sign out and back in to refresh JWT ***
        return NextResponse.json({
            success: true,
            plan: planId,
            planName: plan.name,
            modules: plan.modules,
            validTill: end.toLocaleDateString('en-IN'),
            requiresRelogin: true,   // ← frontend will handle this
        })

    } catch (err: any) {
        console.error('Subscription verify error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}