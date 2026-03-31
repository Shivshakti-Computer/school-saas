// FILE: src/app/api/subscription/cancel/route.ts
// COMPLETE REWRITE: Scheduled cancel + refund logic

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { sanitizeBody } from '@/lib/security'
import Razorpay from 'razorpay'

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// ── GET: Check cancel eligibility & refund info ──
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const sub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: { $in: ['active', 'scheduled_cancel'] },
        }).sort({ createdAt: -1 }).lean() as any

        if (!sub) {
            return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
        }

        const now = new Date()
        const periodEnd = new Date(sub.currentPeriodEnd)
        const periodStart = new Date(sub.currentPeriodStart)
        const daysUsed = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
        const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))

        // Refund eligibility
        let refundEligible = false
        let refundAmount = 0
        let refundReason = ''

        if (sub.billingCycle === 'yearly') {
            const purchaseDate = new Date(sub.currentPeriodStart)
            const thirtyDaysAfterPurchase = new Date(purchaseDate)
            thirtyDaysAfterPurchase.setDate(thirtyDaysAfterPurchase.getDate() + 30)

            if (now <= thirtyDaysAfterPurchase) {
                refundEligible = true
                const dailyRate = sub.amount / totalDays
                refundAmount = Math.round((totalDays - daysUsed) * dailyRate)
                refundReason = `Yearly plan cancelled within 30 days. ${daysUsed} days used.`
            } else {
                refundReason = 'Refund period expired (30 days from purchase). Access continues till period end.'
            }
        } else {
            refundReason = 'Monthly plans are not eligible for refund. Access continues till period end.'
        }

        return NextResponse.json({
            subscription: {
                plan: sub.plan,
                billingCycle: sub.billingCycle,
                amount: sub.amount,
                status: sub.status,
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                daysUsed,
                daysRemaining,
                totalDays,
                isScheduledCancel: sub.status === 'scheduled_cancel',
                scheduledCancelAt: sub.scheduledCancelAt?.toISOString() || null,
            },
            refund: {
                eligible: refundEligible,
                amount: refundAmount,
                reason: refundReason,
                deadline: sub.billingCycle === 'yearly'
                    ? new Date(new Date(sub.currentPeriodStart).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    : null,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// ── POST: Schedule cancellation (NOT immediate) ──
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const body = sanitizeBody(await req.json())
        const { reason, feedback, category, requestRefund } = body

        if (!reason || !category) {
            return NextResponse.json(
                { error: 'Please provide a reason and category for cancellation' },
                { status: 400 }
            )
        }

        const sub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: 'active',
        }).sort({ createdAt: -1 })

        if (!sub) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
        }

        const now = new Date()
        const periodEnd = new Date(sub.currentPeriodEnd)

        // ── Handle Refund (Yearly only, within 30 days) ──
        let refundProcessed = false
        let refundAmount = 0

        if (requestRefund && sub.billingCycle === 'yearly') {
            const purchaseDate = new Date(sub.currentPeriodStart)
            const thirtyDaysAfterPurchase = new Date(purchaseDate)
            thirtyDaysAfterPurchase.setDate(thirtyDaysAfterPurchase.getDate() + 30)

            if (now <= thirtyDaysAfterPurchase) {
                const totalDays = Math.ceil(
                    (periodEnd.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                )
                const daysUsed = Math.ceil(
                    (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                )
                const dailyRate = sub.amount / totalDays
                refundAmount = Math.round((totalDays - daysUsed) * dailyRate)

                // Find the payment to refund
                const lastPayment = sub.paymentHistory?.length > 0
                    ? sub.paymentHistory[sub.paymentHistory.length - 1]
                    : null

                if (lastPayment && refundAmount > 0) {
                    try {
                        // Razorpay Partial Refund
                        const refund = await rzp.payments.refund(lastPayment.razorpayPaymentId, {
                            amount: refundAmount * 100, // paise
                            speed: 'normal',
                            notes: {
                                reason: `Subscription cancelled - ${reason}`,
                                schoolId: session.user.tenantId,
                                plan: sub.plan,
                            },
                        })

                        // Record refund
                        sub.refundHistory.push({
                            razorpayRefundId: refund.id,
                            razorpayPaymentId: lastPayment.razorpayPaymentId,
                            amount: refundAmount,
                            status: 'processed',
                            reason: `Yearly plan cancelled within 30 days. ${daysUsed} days used.`,
                            initiatedAt: now,
                            processedAt: now,
                        })

                        // Update payment status
                        if (lastPayment) {
                            lastPayment.status = 'refunded'
                        }

                        refundProcessed = true

                        // Immediate cancel since refund processed
                        sub.status = 'cancelled'
                        sub.cancelledAt = now
                        sub.cancelReason = reason
                        sub.cancelFeedback = feedback
                        sub.cancelCategory = category

                        await sub.save()

                        // Downgrade school immediately
                        await School.findByIdAndUpdate(session.user.tenantId, {
                            subscriptionId: null,
                            plan: 'starter',
                            modules: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery'],
                        })

                    } catch (refundErr: any) {
                        console.error('Razorpay refund error:', refundErr)
                        // Even if refund fails, still schedule cancel
                        refundProcessed = false
                    }
                }
            }
        }

        // ── If no refund, schedule cancel at period end ──
        if (!refundProcessed) {
            sub.status = 'scheduled_cancel'
            sub.cancelledAt = now
            sub.cancelReason = reason
            sub.cancelFeedback = feedback
            sub.cancelCategory = category
            sub.scheduledCancelAt = periodEnd  // Access continues till period end

            await sub.save()
            // School plan stays active until period end — middleware handles this
        }

        // Audit
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: 'admin',
            action: 'SUBSCRIPTION_CANCEL',
            resource: 'Subscription',
            resourceId: sub._id?.toString(),
            description: refundProcessed
                ? `Subscription cancelled with refund ₹${refundAmount}. Plan: ${sub.plan}`
                : `Subscription scheduled for cancel at period end. Plan: ${sub.plan}`,
            metadata: {
                plan: sub.plan,
                billingCycle: sub.billingCycle,
                cancelReason: reason,
                cancelCategory: category,
                cancelFeedback: feedback,
                refundProcessed,
                refundAmount: refundProcessed ? refundAmount : 0,
                scheduledCancelAt: refundProcessed ? null : periodEnd.toISOString(),
            },
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            success: true,
            type: refundProcessed ? 'immediate_cancel' : 'scheduled_cancel',
            refund: refundProcessed ? {
                amount: refundAmount,
                message: `₹${refundAmount.toLocaleString('en-IN')} refund initiated. Will reflect in 5-7 business days.`,
            } : null,
            scheduledAt: refundProcessed ? null : periodEnd.toISOString(),
            message: refundProcessed
                ? 'Subscription cancelled and refund initiated.'
                : `Your subscription will remain active until ${periodEnd.toLocaleDateString('en-IN')}. After that, it will be downgraded to Starter.`,
        })

    } catch (err: any) {
        console.error('Cancel error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// ── DELETE: Undo scheduled cancel (re-activate) ──
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const sub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: 'scheduled_cancel',
        })

        if (!sub) {
            return NextResponse.json({ error: 'No scheduled cancellation found' }, { status: 404 })
        }

        sub.status = 'active'
        sub.cancelledAt = undefined
        sub.cancelReason = undefined
        sub.cancelFeedback = undefined
        sub.cancelCategory = undefined
        sub.scheduledCancelAt = undefined
        await sub.save()

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: 'admin',
            action: 'SUBSCRIPTION_CREATE',
            resource: 'Subscription',
            description: 'Scheduled cancellation reversed — subscription re-activated',
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            success: true,
            message: 'Cancellation reversed. Your subscription is active again!',
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}