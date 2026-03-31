// FILE: src/app/api/subscription/verify/route.ts
// UPDATED: Fixed email import, added audit log, payment history

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getPlan } from '@/lib/plans'
import { sendMessage, MESSAGE_TEMPLATES } from '@/lib/messaging'
import { logAudit } from '@/lib/audit'
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
      await logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userRole: 'admin',
        action: 'PAYMENT_FAILED',
        resource: 'Payment',
        description: 'Invalid payment signature',
        metadata: { razorpay_order_id, planId },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        status: 'FAILURE',
      })
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
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

    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

    // Generate invoice number
    const invoiceCount = await Subscription.countDocuments({ tenantId: school._id })
    const invoiceNumber = `INV-${school.subdomain.toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

    // Cancel existing active subscriptions
    await Subscription.updateMany(
      { tenantId: school._id, status: 'active' },
      { status: 'cancelled', cancelledAt: now, cancelReason: 'New subscription' }
    )

    // Create new subscription with payment history
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
      paymentHistory: [{
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount,
        currency: 'INR',
        status: 'captured',
        paidAt: now,
        invoiceNumber,
      }],
    })

    // Update school
    await School.findByIdAndUpdate(school._id, {
      plan: planId,
      subscriptionId: subscription._id.toString(),
      modules: plan.modules,
      trialEndsAt: end,
    })

    // Audit log
    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      userRole: 'admin',
      action: 'PAYMENT_SUCCESS',
      resource: 'Payment',
      resourceId: subscription._id.toString(),
      description: `Subscription activated: ${plan.name} (${billingCycle}) - ₹${amount}`,
      metadata: {
        planId, billingCycle, amount,
        razorpay_payment_id, razorpay_order_id,
        invoiceNumber, validTill: end.toISOString(),
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    })

    // Send confirmation email
    if (school.email) {
      try {
        await sendMessage({
          tenantId: school._id.toString(),
          channel: 'email',
          to: school.email,
          subject: `Skolify - ${plan.name} Plan Activated!`,
          message: `Your ${plan.name} plan is now active. Valid till ${end.toLocaleDateString('en-IN')}.`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
              <h2 style="color:#4F46E5">🎉 Payment Successful!</h2>
              <p>Hi ${session.user.name},</p>
              <p>Your <strong>${plan.name} Plan</strong> (${billingCycle}) has been activated.</p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:4px 0"><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                <p style="margin:4px 0"><strong>Invoice:</strong> ${invoiceNumber}</p>
                <p style="margin:4px 0"><strong>Valid Till:</strong> ${end.toLocaleDateString('en-IN')}</p>
                <p style="margin:4px 0"><strong>Modules:</strong> ${plan.modules.length} active</p>
              </div>
              <p style="color:#64748B;font-size:13px">Login to <a href="https://skolify.in/login">skolify.in</a> to access all features.</p>
              <p style="color:#94A3B8;font-size:11px;margin-top:20px">Skolify — Powered by Shivshakti Computer Academy</p>
            </div>
          `,
          skipLimitCheck: true, // System email, don't count towards limit
        })
      } catch (emailErr) {
        console.error('Payment confirmation email failed:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      plan: planId,
      planName: plan.name,
      modules: plan.modules,
      validTill: end.toLocaleDateString('en-IN'),
      invoiceNumber,
      requiresRelogin: true,
    })
  } catch (err: any) {
    console.error('Subscription verify error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}