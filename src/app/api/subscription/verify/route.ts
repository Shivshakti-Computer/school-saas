// FILE: src/app/api/subscription/verify/route.ts
// UPDATED — grantMonthlyCredits + correct messaging import
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getPlan } from '@/config/pricing'
import { grantMonthlyCredits } from '@/lib/credits'
import { sendMessage } from '@/lib/messaging'
import { logAudit } from '@/lib/audit'
import crypto from 'crypto'
import type { PlanId, BillingCycle } from '@/config/pricing'

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

    // ── Verify signature ──
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      await logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userRole: 'admin',
        action: 'PAYMENT_FAILED',
        resource: 'Payment',
        description: 'Invalid payment signature',
        metadata: { razorpay_order_id, planId },
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        status: 'FAILURE',
      })
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    const plan = getPlan(planId as PlanId)
    const school = await School.findById(session.user.tenantId)
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const now = new Date()
    const end = new Date(now)
    if ((billingCycle as BillingCycle) === 'monthly') {
      end.setDate(end.getDate() + 30)
    } else {
      end.setDate(end.getDate() + 365)
    }

    const amount =
      billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

    // ── Invoice number ──
    const invoiceCount = await Subscription.countDocuments({
      tenantId: school._id,
    })
    const invoiceNumber = `INV-${school.subdomain.toUpperCase()}-${String(
      invoiceCount + 1
    ).padStart(4, '0')}`

    // ── Cancel existing active subscriptions ──
    await Subscription.updateMany(
      { tenantId: school._id, status: { $in: ['active', 'scheduled_cancel'] } },
      {
        status: 'cancelled',
        cancelledAt: now,
        cancelReason: 'New subscription purchased',
      }
    )

    // ── Create new subscription ──
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
      invoiceCount: 1,
      lastPaymentAt: now,
      paymentHistory: [
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          amount,
          currency: 'INR',
          status: 'captured',
          paidAt: now,
          invoiceNumber,
        },
      ],
    })

    // ── Update school ──
    await School.findByIdAndUpdate(school._id, {
      plan: planId,
      subscriptionId: subscription._id.toString(),
      modules: plan.modules,
    })

    // ── NEW: Grant first month credits for new subscription ──
    try {
      await grantMonthlyCredits(
        school._id.toString(),
        planId as PlanId,
        false
      )
    } catch (creditErr) {
      console.error('Credit grant failed (non-critical):', creditErr)
    }

    // ── Audit log ──
    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      userRole: 'admin',
      action: 'PAYMENT_SUCCESS',
      resource: 'Payment',
      resourceId: subscription._id.toString(),
      description: `Subscription activated: ${plan.name} (${billingCycle}) — ₹${amount}`,
      metadata: {
        planId,
        billingCycle,
        amount,
        razorpay_payment_id,
        razorpay_order_id,
        invoiceNumber,
        validTill: end.toISOString(),
        freeCreditsGranted: plan.freeCreditsPerMonth,
      },
      ipAddress:
        req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    })

    // ── Send confirmation email (system — skip credit check) ──
    if (school.email) {
      try {
        await sendMessage({
          tenantId: school._id.toString(),
          channel: 'email',
          purpose: 'subscription_confirm',
          recipient: school.email,
          subject: `Skolify — ${plan.name} Plan Activated!`,
          message: `Your ${plan.name} plan is active. Valid till ${end.toLocaleDateString('en-IN')}.`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
              <h2 style="color:#4F46E5">🎉 Payment Successful!</h2>
              <p>Hi ${session.user.name},</p>
              <p>Your <strong>${plan.name} Plan</strong> (${billingCycle}) has been activated.</p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:4px 0"><strong>Plan:</strong> ${plan.name} (${billingCycle})</p>
                <p style="margin:4px 0"><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                <p style="margin:4px 0"><strong>Invoice:</strong> ${invoiceNumber}</p>
                <p style="margin:4px 0"><strong>Valid Till:</strong> ${end.toLocaleDateString('en-IN')}</p>
                <p style="margin:4px 0"><strong>Free Credits:</strong> ${plan.freeCreditsPerMonth}/month</p>
              </div>
              <p style="color:#64748B;font-size:13px">
                Login to <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">skolify.in</a> to access all features.
              </p>
              <p style="color:#94A3B8;font-size:11px;margin-top:20px">
                Skolify — Powered by Shivshakti Computer Academy
              </p>
            </div>
          `,
          skipCreditCheck: true, // System email
        })
      } catch (emailErr) {
        console.error('Payment confirmation email failed (non-critical):', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      plan: planId,
      planName: plan.name,
      modules: plan.modules,
      validTill: end.toLocaleDateString('en-IN'),
      invoiceNumber,
      freeCreditsGranted: plan.freeCreditsPerMonth,
      requiresRelogin: true,
    })

  } catch (err: any) {
    console.error('Subscription verify error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}