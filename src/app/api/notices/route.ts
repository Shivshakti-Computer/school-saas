// FILE: src/app/api/notices/route.ts
// UPDATED: SMS blast via credit system
// BACKWARD COMPATIBLE — same GET/POST structure
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { User } from '@/models/User'
import { PUSH_TEMPLATES, sendPushToTenant } from '@/lib/push'
import { checkCredits } from '@/lib/credits'
import { sendBulkMessages, SMS_TEMPLATES } from '@/lib/message'

// ── GET — same as before ──
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const role = session.user.role
    const now = new Date()

    const query: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    }

    if (role !== 'admin') {
      query.$or = [
        { targetRole: 'all' },
        { targetRole: role },
      ]
    }

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishedAt: -1 })
      .limit(50)
      .lean()

    const activeNotices = notices.filter(n => {
      if (!n.expiresAt) return true
      return new Date(n.expiresAt) >= now
    })

    return NextResponse.json({ notices: activeNotices })

  } catch (err: any) {
    console.error('Notices GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST — credit system integrated ──
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (
      !session?.user ||
      !['admin', 'teacher', 'staff'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'title and content required' },
        { status: 400 }
      )
    }

    // ── Create notice ──
    const notice = await Notice.create({
      tenantId: session.user.tenantId,
      title: body.title,
      content: body.content,
      targetRole: body.targetRole ?? 'all',
      targetClass: body.targetClass,
      priority: body.priority ?? 'normal',
      publishedAt: new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      createdBy: session.user.id,
      isActive: true,
      smsSent: false,
      pushSent: false,
      smsCount: 0,
    })

    // ── SMS blast via credit system ──
    let smsResult = {
      sent: 0,
      failed: 0,
      skipped: 0,
      creditsUsed: 0,
      creditError: '',
    }

    if (body.sendSms) {
      try {
        // Get target users
        const userQuery: any = {
          tenantId: session.user.tenantId,
          isActive: true,
        }
        if (body.targetRole && body.targetRole !== 'all') {
          userQuery.role = body.targetRole
        }

        const users = await User.find(userQuery)
          .select('phone name')
          .lean()

        const validUsers = users.filter((u: any) => u.phone)

        if (validUsers.length > 0) {
          // Check credits before sending
          const creditCheck = await checkCredits(
            session.user.tenantId,
            'sms',
            validUsers.length
          )

          if (!creditCheck.canSend) {
            smsResult.creditError = creditCheck.message ||
              `Insufficient credits. Balance: ${creditCheck.balance}, Required: ${creditCheck.required}`
            smsResult.skipped = validUsers.length
          } else {
            // Build recipients
            const recipients = validUsers.map((u: any) => ({
              recipient: u.phone,
              recipientName: u.name || 'User',
              message: SMS_TEMPLATES.notice(
                session.user.schoolName,
                body.title
              ),
            }))

            // Send in chunks of 1000 (MSG91 limit)
            const CHUNK = 1000
            for (let i = 0; i < recipients.length; i += CHUNK) {
              const chunk = recipients.slice(i, i + CHUNK)
              const chunkResult = await sendBulkMessages({
                tenantId: session.user.tenantId,
                channel: 'sms',
                purpose: 'notice',
                recipients: chunk,
                sentBy: session.user.id,
                sentByName: session.user.name,
              })
              smsResult.sent += chunkResult.sent
              smsResult.failed += chunkResult.failed
              smsResult.skipped += chunkResult.skipped
              smsResult.creditsUsed += chunkResult.creditsUsed

              // Stop if credits run out mid-blast
              if (chunkResult.insufficientCredits) {
                smsResult.creditError = 'Credits exhausted mid-blast. Remaining messages skipped.'
                break
              }
            }

            // Update notice with SMS stats
            await Notice.findByIdAndUpdate(notice._id, {
              smsSent: smsResult.sent > 0,
              smsCount: smsResult.sent,
            })
          }
        }
      } catch (smsErr) {
        console.error('SMS blast error (non-critical):', smsErr)
        smsResult.creditError = 'SMS send failed'
      }
    }

    // ── Push notifications ──
    try {
      const pushPayload = PUSH_TEMPLATES.noticePosted(
        session.user.schoolName,
        body.title
      )
      await sendPushToTenant(
        session.user.tenantId,
        body.targetRole === 'all'
          ? ['student', 'parent', 'teacher']
          : [body.targetRole],
        pushPayload
      ).catch(console.error)
    } catch (pushErr) {
      console.error('Push error (non-critical):', pushErr)
    }

    const saved = await Notice.findById(notice._id).lean()

    return NextResponse.json(
      {
        notice: saved,
        sms: body.sendSms ? smsResult : null,
        // Warning if credit issues
        warning: smsResult.creditError || undefined,
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error('Notice POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}