// =============================================================
// FILE: src/app/api/cron/daily/route.ts
// MERGED: fee-reminders + trial-reminders + expire-subscriptions
// Vercel cron: runs daily at midnight IST (6:30 PM UTC prev day)
// vercel.json: { "path": "/api/cron/daily", "schedule": "30 18 * * *" }
// =============================================================
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Fee } from '@/models/Fee'
import { Subscription } from '@/models/Subscription'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { sendMessage, MESSAGE_TEMPLATES } from '@/lib/messaging'
import '@/models/Student'

export const maxDuration = 60 // Allow up to 60s for cron

export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await connectDB()
        const now = new Date()
        const results = {
            expiredSubscriptions: 0,
            expiredScheduledCancels: 0,
            feeRemindersSent: 0,
            trialRemindersSent: 0,
            errors: [] as string[],
        }

        // ════════════════════════════════════════════════
        // 1. EXPIRE SUBSCRIPTIONS
        // ════════════════════════════════════════════════

        // 1a. Expire scheduled cancellations whose period ended
        const scheduledCancels = await Subscription.find({
            status: 'scheduled_cancel',
            currentPeriodEnd: { $lte: now },
        })

        for (const sub of scheduledCancels) {
            try {
                sub.status = 'expired'
                await sub.save()

                await School.findByIdAndUpdate(sub.tenantId, {
                    subscriptionId: null,
                    plan: 'starter',
                    modules: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery'],
                })

                results.expiredScheduledCancels++
            } catch (err: any) {
                results.errors.push(`Scheduled cancel expire failed: ${sub.tenantId} - ${err.message}`)
            }
        }

        // 1b. Expire active subscriptions past their end date (no auto-renew)
        const expiredActive = await Subscription.find({
            status: 'active',
            currentPeriodEnd: { $lte: now },
            isDemo: { $ne: true }, // Don't expire demo accounts
        })

        for (const sub of expiredActive) {
            try {
                sub.status = 'expired'
                await sub.save()

                await School.findByIdAndUpdate(sub.tenantId, {
                    subscriptionId: null,
                    plan: 'starter',
                    modules: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery'],
                })

                results.expiredSubscriptions++
            } catch (err: any) {
                results.errors.push(`Active expire failed: ${sub.tenantId} - ${err.message}`)
            }
        }

        // ════════════════════════════════════════════════
        // 2. FEE REMINDERS (3 days before due)
        // ════════════════════════════════════════════════

        const in3Days = new Date(now)
        in3Days.setDate(in3Days.getDate() + 3)

        const dueFees = await Fee.find({
            status: 'pending',
            dueDate: { $gte: now, $lte: in3Days },
            reminderSentAt: null,
        }).populate({
            path: 'studentId',
            select: 'parentPhone admissionNo userId tenantId',
            populate: { path: 'userId', select: 'name' }
        }).lean()

        for (const fee of dueFees) {
            try {
                const student = fee.studentId as any
                if (!student?.parentPhone) continue

                const studentName = student.userId?.name || student.admissionNo
                const dueDate = new Date(fee.dueDate).toLocaleDateString('en-IN')
                const amount = String(fee.finalAmount)

                // Send SMS (with limit check via messaging system)
                await sendMessage({
                    tenantId: student.tenantId?.toString() || '',
                    channel: 'sms',
                    to: student.parentPhone,
                    message: MESSAGE_TEMPLATES.feeReminder(studentName, amount, dueDate),
                })

                // Mark as reminded
                await Fee.findByIdAndUpdate(fee._id, { reminderSentAt: new Date() })
                results.feeRemindersSent++
            } catch (err: any) {
                results.errors.push(`Fee reminder failed: ${fee._id} - ${err.message}`)
            }
        }

        // ════════════════════════════════════════════════
        // 3. TRIAL REMINDERS (3 days before expiry)
        // ════════════════════════════════════════════════

        const trialIn3Days = new Date(now)
        trialIn3Days.setDate(trialIn3Days.getDate() + 3)

        const expiringTrials = await School.find({
            isActive: true,
            subscriptionId: null,
            trialEndsAt: { $gte: now, $lte: trialIn3Days },
        }).lean()

        for (const school of expiringTrials) {
            try {
                if (!school.email) continue

                const daysLeft = Math.ceil(
                    (new Date(school.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )

                const upgradeUrl = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/admin/subscription`
                const { subject, html } = EMAIL_TEMPLATES.trialReminder(
                    school.name, daysLeft, upgradeUrl
                )

                await sendEmail(school.email, subject, html)
                results.trialRemindersSent++
            } catch (err: any) {
                results.errors.push(`Trial reminder failed: ${school.name} - ${err.message}`)
            }
        }

        // ════════════════════════════════════════════════

        console.log(`[CRON DAILY] ${JSON.stringify(results)}`)

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            ...results,
        })
    } catch (err: any) {
        console.error('Daily cron error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}