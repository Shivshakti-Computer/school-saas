// FILE: src/app/api/notices/[id]/publish/route.ts
// Publish draft notice with notifications
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { User } from '@/models/User'
import { logDataChange } from '@/lib/audit'
import { PUSH_TEMPLATES, sendPushToTenant } from '@/lib/push'
import { publishNoticeSchema } from '@/lib/validators/notice'
import { checkCredits } from '@/lib/credits'
import { sendBulkMessages, SMS_TEMPLATES } from '@/lib/message'

// ✅ FIXED: params is now a Promise in Next.js 15
interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  const guard = await apiGuardWithBody(req, {
    allowedRoles: ['admin', 'teacher', 'staff'],
    rateLimit: 'mutation',
    requiredModules: ['notices'],
  })

  if (guard instanceof NextResponse) return guard
  const { session, body, clientInfo } = guard

  try {
    await connectDB()

    const validated = publishNoticeSchema.parse(body)

    // ✅ FIXED: Await params
    const { id } = await context.params

    // ── Find Notice ──
    const notice = await Notice.findOne({
      _id: id,
      tenantId: session.user.tenantId,
      isActive: true,
    })

    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      )
    }

    // ── Check if already published ──
    if (notice.status === 'published') {
      return NextResponse.json(
        { error: 'Notice is already published' },
        { status: 400 }
      )
    }

    // ── Store Previous State ──
    const previousData = notice.toObject()

    // ── Update Status ──
    notice.status = 'published'
    notice.publishedAt = new Date()
    await notice.save()

    // ── Get Recipients ──
    const query: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    }

    if (notice.targetRole !== 'all') {
      query.role = notice.targetRole
    }

    if (notice.targetClasses.length > 0) {
      query.class = { $in: notice.targetClasses }
    }

    const users = await User.find(query)
      .select('phone email name')
      .lean()

    let smsResult: any = null
    let emailResult: any = null
    let pushSent = false

    // ── SMS Notification ──
    if (validated.sendSms) {
      const smsRecipients = users
        .filter(u => u.phone)
        .map(u => ({
          recipient: u.phone!,
          recipientName: u.name,
          message: SMS_TEMPLATES.notice(session.user.schoolName, notice.title),
        }))

      if (smsRecipients.length > 0) {
        const creditCheck = await checkCredits(
          session.user.tenantId,
          'sms',
          smsRecipients.length
        )

        if (creditCheck.canSend) {
          smsResult = await sendBulkMessages({
            tenantId: session.user.tenantId,
            channel: 'sms',
            purpose: 'notice',
            recipients: smsRecipients,
            sentBy: session.user.id,
            sentByName: session.user.name,
          })

          notice.smsSent = smsResult.sent > 0
          notice.notificationCount = smsResult.sent
        } else {
          smsResult = {
            sent: 0,
            failed: 0,
            skipped: smsRecipients.length,
            creditsUsed: 0,
            creditError: creditCheck.message,
          }
        }
      }
    }

    // ── Email Notification ──
    if (validated.sendEmail) {
      const emailRecipients = users
        .filter(u => u.email)
        .map(u => ({
          recipient: u.email!,
          recipientName: u.name,
          message: `New Notice: ${notice.title}`,
        }))

      if (emailRecipients.length > 0) {
        emailResult = await sendBulkMessages({
          tenantId: session.user.tenantId,
          channel: 'email',
          purpose: 'notice',
          recipients: emailRecipients,
          sentBy: session.user.id,
          sentByName: session.user.name,
          subject: `📢 ${notice.title} — ${session.user.schoolName}`,
        })

        notice.emailSent = emailResult.sent > 0
      }
    }

    // ── Push Notification ──
    if (validated.sendPush) {
      try {
        const roles = notice.targetRole === 'all'
          ? ['student', 'parent', 'teacher', 'staff']
          : [notice.targetRole]

        await sendPushToTenant(
          session.user.tenantId,
          roles,
          PUSH_TEMPLATES.noticePosted(session.user.schoolName, notice.title)
        )

        notice.pushSent = true
        pushSent = true
      } catch (err) {
        console.error('Push error:', err)
      }
    }

    await notice.save()

    // ── Audit Log ──
    await logDataChange(
      'UPDATE',
      'Notice',
      notice._id.toString(),
      `Published notice: ${notice.title}`,
      session,
      clientInfo.ip,
      previousData,
      notice.toObject()
    )

    return NextResponse.json({
      success: true,
      notice: notice.toObject(),
      notifications: {
        sms: smsResult,
        email: emailResult,
        push: { sent: pushSent },
      },
    })

  } catch (err: any) {
    console.error('Publish notice error:', err)

    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}