// FILE: src/app/api/notices/route.ts
// COMPLETE PRODUCTION VERSION WITH WHATSAPP SUPPORT

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody, apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { logAudit } from '@/lib/audit'
import { PUSH_TEMPLATES, sendPushToTenant } from '@/lib/push'
import { sendBulkMessages } from '@/lib/message'
import { noticeFilterSchema, createNoticeSchema } from '@/lib/validators/notice'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import type { NoticeListResponse, NoticeCreateResponse } from '@/types/notice'

// ══════════════════════════════════════════════════════════
// Helper: Get User Class
// ══════════════════════════════════════════════════════════

async function getUserClass(userId: string): Promise<string | null> {
  try {
    const user = await User.findById(userId).select('class').lean()
    return user?.class || null
  } catch {
    return null
  }
}

// ══════════════════════════════════════════════════════════
// Helper: Get Notification Recipients (ALL CHANNELS)
// ══════════════════════════════════════════════════════════

async function getNotificationRecipients(
  tenantId: string,
  targetRole: string,
  targetClasses: string[],
  academicYear: string
) {
  // ── For Students/Parents ──
  if (
    targetRole === 'student' ||
    targetRole === 'parent' ||
    targetRole === 'all'
  ) {
    const studentFilter: any = {
      tenantId,
      academicYear,
      status: 'active',
    }

    if (targetClasses.length > 0) {
      studentFilter.class = { $in: targetClasses }
    }

    const students = await Student.find(studentFilter)
      .select('_id parentPhone parentEmail userId')
      .populate('userId', 'phone email name')
      .lean()

    if (targetRole === 'student') {
      // Student contacts only
      const studentContacts = students
        .filter(s => (s.userId as any)?.phone)
        .map(s => ({
          recipient: (s.userId as any).phone,
          recipientName: (s.userId as any).name || 'Student',
        }))

      return {
        sms: studentContacts,
        email: students
          .filter(s => (s.userId as any)?.email)
          .map(s => ({
            recipient: (s.userId as any).email,
            recipientName: (s.userId as any).name || 'Student',
          })),
        whatsapp: studentContacts, // ✅ WhatsApp uses phone numbers like SMS
      }
    } else if (targetRole === 'parent') {
      // Parent contacts only
      const parentContacts = students
        .filter(s => s.parentPhone)
        .map(s => ({
          recipient: s.parentPhone!,
          recipientName: (s.userId as any)?.name + "'s Parent" || 'Parent',
        }))

      return {
        sms: parentContacts,
        email: students
          .filter(s => s.parentEmail)
          .map(s => ({
            recipient: s.parentEmail!,
            recipientName: (s.userId as any)?.name + "'s Parent" || 'Parent',
          })),
        whatsapp: parentContacts, // ✅ WhatsApp = parent phone
      }
    } else {
      // All: Students + Parents + Teachers + Staff
      const users = await User.find({
        tenantId,
        isActive: true,
      }).select('phone email name role').lean()

      const phoneContacts = users
        .filter(u => u.phone)
        .map(u => ({
          recipient: u.phone!,
          recipientName: u.name,
        }))

      return {
        sms: phoneContacts,
        email: users
          .filter(u => u.email)
          .map(u => ({
            recipient: u.email!,
            recipientName: u.name,
          })),
        whatsapp: phoneContacts, // ✅ WhatsApp = all phone numbers
      }
    }
  }

  // ── For Teacher/Staff Only ──
  const users = await User.find({
    tenantId,
    isActive: true,
    role: targetRole,
  }).select('phone email name').lean()

  const phoneContacts = users
    .filter(u => u.phone)
    .map(u => ({
      recipient: u.phone!,
      recipientName: u.name,
    }))

  return {
    sms: phoneContacts,
    email: users
      .filter(u => u.email)
      .map(u => ({
        recipient: u.email!,
        recipientName: u.name,
      })),
    whatsapp: phoneContacts, // ✅ WhatsApp = phone numbers
  }
}

// ══════════════════════════════════════════════════════════
// GET — List Notices
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const guard = await apiGuard(req, {
    allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
    rateLimit: 'api',
    auditAction: 'VIEW',
    auditResource: 'Notice',
  })

  if (guard instanceof NextResponse) return guard
  const { session, clientInfo } = guard

  try {
    await connectDB()

    const url = new URL(req.url)
    const rawFilters = {
      status: url.searchParams.get('status') || undefined,
      targetRole: url.searchParams.get('targetRole') || undefined,
      priority: url.searchParams.get('priority') || undefined,
      search: url.searchParams.get('search') || undefined,
      isPinned: url.searchParams.get('isPinned') === 'true' ? true : undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      sortBy: url.searchParams.get('sortBy') || 'publishedAt',
      sortOrder: url.searchParams.get('sortOrder') || 'desc',
    }

    const filters = noticeFilterSchema.parse(rawFilters)

    const query: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    }

    // Role-based filtering
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      query.$or = [
        { targetRole: 'all' },
        { targetRole: session.user.role },
      ]

      if (session.user.role === 'student' || session.user.role === 'parent') {
        const userClass = await getUserClass(session.user.id)
        if (userClass) {
          query.$and = [
            {
              $or: [
                { targetClasses: { $size: 0 } },
                { targetClasses: userClass },
              ],
            },
          ]
        }
      }
    }

    // Apply filters
    if (filters.status) query.status = filters.status
    if (filters.targetRole) query.targetRole = filters.targetRole
    if (filters.priority) query.priority = filters.priority
    if (filters.isPinned !== undefined) query.isPinned = filters.isPinned
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    const total = await Notice.countDocuments(query)
    const skip = (filters.page - 1) * filters.limit
    const pages = Math.ceil(total / filters.limit)

    const sort: any = {}
    if (filters.sortBy === 'priority') {
      sort.priority = filters.sortOrder === 'desc' ? -1 : 1
      sort.publishedAt = -1
    } else {
      sort[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1
    }
    sort.isPinned = -1

    const notices = await Notice.find(query)
      .sort(sort)
      .skip(skip)
      .limit(filters.limit)
      .select('-__v')
      .lean()

    const now = new Date()
    const activeNotices = notices
      .filter(n => {
        if (!n.expiresAt) return true
        return new Date(n.expiresAt) >= now
      })
      .map(n => ({
        ...n,
        isExpired: n.expiresAt ? new Date(n.expiresAt) < now : false,
      }))

    let stats
    if (session.user.role === 'admin' || session.user.role === 'superadmin') {
      const [published, draft, archived, pinned, urgent] = await Promise.all([
        Notice.countDocuments({
          tenantId: session.user.tenantId,
          status: 'published',
          isActive: true,
        }),
        Notice.countDocuments({
          tenantId: session.user.tenantId,
          status: 'draft',
          isActive: true,
        }),
        Notice.countDocuments({
          tenantId: session.user.tenantId,
          status: 'archived',
          isActive: true,
        }),
        Notice.countDocuments({
          tenantId: session.user.tenantId,
          isPinned: true,
          isActive: true,
        }),
        Notice.countDocuments({
          tenantId: session.user.tenantId,
          priority: 'urgent',
          status: 'published',
          isActive: true,
        }),
      ])

      stats = { total, published, draft, archived, pinned, urgent }
    }

    const response: NoticeListResponse = {
      notices: activeNotices as any,
      total: activeNotices.length,
      page: filters.page,
      limit: filters.limit,
      pages,
      stats,
    }

    return NextResponse.json(response)

  } catch (err: any) {
    console.error('Notices GET error:', err)

    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'VIEW',
      resource: 'Notice',
      description: `Failed to fetch notices: ${err.message}`,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'FAILURE',
    })

    return NextResponse.json(
      { error: err.message || 'Failed to fetch notices' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════
// POST — Create Notice with Multi-Channel Support
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithBody(req, {
    allowedRoles: ['admin', 'teacher', 'staff'],
    rateLimit: 'mutation',
    requiredModules: ['notices'],
    auditAction: 'CREATE',
    auditResource: 'Notice',
  })

  if (guard instanceof NextResponse) return guard
  const { session, body, clientInfo } = guard

  try {
    await connectDB()

    const validated = createNoticeSchema.parse(body)
    const academicYear = (body as any).academicYear || getCurrentAcademicYear()

    // Create notice
    const notice = await Notice.create({
      tenantId: session.user.tenantId,
      title: validated.title,
      content: validated.content,
      status: validated.status,
      targetRole: validated.targetRole,
      targetClasses: validated.targetClasses,
      priority: validated.priority,
      expiresAt: validated.expiresAt || undefined,
      isPinned: validated.isPinned,
      attachments: validated.attachments || [],
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdByRole: session.user.role,
      isActive: true,
      smsSent: false,
      emailSent: false,
      whatsappSent: false,
      pushSent: false,
      notificationCount: 0,
      readCount: 0,
      creditsUsed: 0,
    })

    if (validated.status === 'published') {
      notice.publishedAt = new Date()
      await notice.save()
    }

    let smsResult: any = null
    let emailResult: any = null
    let whatsappResult: any = null
    let pushResult: any = null
    let totalCreditsUsed = 0

    if (validated.status === 'published') {
      // ── Get ALL recipients (raw) ──────────────────────
      const allRecipients = await getNotificationRecipients(
        session.user.tenantId,
        validated.targetRole,
        validated.targetClasses,
        academicYear
      )

      // ╔══════════════════════════════════════════════╗
      // ║  Bug 2+3 Fix: Channel-specific filtering     ║
      // ║  Sirf valid contacts pass karo per channel   ║
      // ╚══════════════════════════════════════════════╝

      // ── SMS ─────────────────────────────────────────
      // sirf jinke paas phone hai
      if (validated.sendSms) {
        const smsRecipients = allRecipients.sms.filter(
          r => r.recipient && r.recipient.trim() !== ''
        )

        if (smsRecipients.length === 0) {
          // No valid phone numbers — skip gracefully
          console.log('[NOTICE] SMS: No valid phone recipients, skipping')
          smsResult = {
            total: 0, sent: 0, failed: 0,
            skipped: 0, creditsUsed: 0,
            insufficientCredits: false,
            skipReason: 'No valid phone numbers found',
          }
        } else {
          smsResult = await sendBulkMessages({
            tenantId: session.user.tenantId,
            channel: 'sms',
            purpose: 'notice',
            recipients: smsRecipients.map(r => ({
              recipient: r.recipient,
              recipientName: r.recipientName,
              message: `📢 ${session.user.schoolName}: ${validated.title}`,
            })),
            sentBy: session.user.id,
            sentByName: session.user.name,
          })

          if (smsResult.insufficientCredits) {
            await Notice.findByIdAndDelete(notice._id)
            return NextResponse.json(
              {
                error: 'Insufficient credits for SMS',
                code: 'INSUFFICIENT_CREDITS',
                required: smsRecipients.length,
                balance: smsResult.balance,
              },
              { status: 402 }
            )
          }

          totalCreditsUsed += smsResult.creditsUsed || 0
          notice.smsSent = smsResult.sent > 0
          notice.notificationCount = smsResult.sent
        }
      }

      // ── WhatsApp ─────────────────────────────────────
      // sirf jinke paas phone hai
      if (validated.sendWhatsApp) {
        const waRecipients = allRecipients.whatsapp.filter(
          r => r.recipient && r.recipient.trim() !== ''
        )

        if (waRecipients.length === 0) {
          console.log('[NOTICE] WhatsApp: No valid phone recipients, skipping')
          whatsappResult = {
            total: 0, sent: 0, failed: 0,
            skipped: 0, creditsUsed: 0,
            insufficientCredits: false,
            skipReason: 'No valid phone numbers found',
          }
        } else {
          whatsappResult = await sendBulkMessages({
            tenantId: session.user.tenantId,
            channel: 'whatsapp',
            purpose: 'notice',
            recipients: waRecipients.map(r => ({
              recipient: r.recipient,
              recipientName: r.recipientName,
              message: `📢 *${session.user.schoolName}*\n\n*${validated.title}*\n\n${validated.content}`,
            })),
            sentBy: session.user.id,
            sentByName: session.user.name,
          })

          if (whatsappResult.insufficientCredits) {
            await Notice.findByIdAndDelete(notice._id)
            return NextResponse.json(
              {
                error: 'Insufficient credits for WhatsApp',
                code: 'INSUFFICIENT_CREDITS',
                required: waRecipients.length,
                balance: whatsappResult.balance,
              },
              { status: 402 }
            )
          }

          totalCreditsUsed += whatsappResult.creditsUsed || 0
          notice.whatsappSent = whatsappResult.sent > 0
          notice.notificationCount += whatsappResult.sent
        }
      }

      // ── Email ────────────────────────────────────────
      // Bug Fix: sirf jinke paas EMAIL hai — phone nahi
      if (validated.sendEmail) {
        const emailRecipients = allRecipients.email.filter(
          r => r.recipient &&
            r.recipient.trim() !== '' &&
            r.recipient.includes('@')   // valid email check
        )

        if (emailRecipients.length === 0) {
          console.log('[NOTICE] Email: No valid email recipients, skipping')
          emailResult = {
            total: 0, sent: 0, failed: 0,
            skipped: 0, creditsUsed: 0,
            insufficientCredits: false,
            skipReason: 'No valid email addresses found',
          }
        } else {
          emailResult = await sendBulkMessages({
            tenantId: session.user.tenantId,
            channel: 'email',
            purpose: 'notice',
            recipients: emailRecipients.map(r => ({
              recipient: r.recipient,
              recipientName: r.recipientName,
              message: validated.content,
            })),
            sentBy: session.user.id,
            sentByName: session.user.name,
            subject: `📢 ${validated.title} — ${session.user.schoolName}`,
          })

          if (emailResult.insufficientCredits) {
            await Notice.findByIdAndDelete(notice._id)
            return NextResponse.json(
              {
                error: 'Insufficient credits for Email',
                code: 'INSUFFICIENT_CREDITS',
                required: emailRecipients.length,
                balance: emailResult.balance,
              },
              { status: 402 }
            )
          }

          totalCreditsUsed += emailResult.creditsUsed || 0
          notice.emailSent = emailResult.sent > 0
        }
      }

      // ── Push (Free) ──────────────────────────────────
      if (validated.sendPush) {
        try {
          const roles =
            validated.targetRole === 'all'
              ? ['student', 'parent', 'teacher', 'staff']
              : [validated.targetRole]

          await sendPushToTenant(
            session.user.tenantId,
            roles,
            PUSH_TEMPLATES.noticePosted(
              session.user.schoolName,
              validated.title
            )
          )

          notice.pushSent = true
          pushResult = { sent: true }
        } catch (err) {
          console.error('Push error:', err)
          pushResult = { sent: false }
        }
      }

      notice.creditsUsed = Math.round(totalCreditsUsed * 100) / 100
      await notice.save()
    }

    // Audit log
    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'CREATE',
      resource: 'Notice',
      resourceId: notice._id.toString(),
      description: `Created notice: ${validated.title}`,
      metadata: {
        status: validated.status,
        targetRole: validated.targetRole,
        priority: validated.priority,
        sendSms: validated.sendSms,
        sendWhatsApp: validated.sendWhatsApp,
        sendEmail: validated.sendEmail,
        creditsUsed: totalCreditsUsed,
        // ✅ Per-channel stats for debugging
        smsStats: smsResult ? { sent: smsResult.sent, failed: smsResult.failed } : null,
        whatsappStats: whatsappResult ? { sent: whatsappResult.sent, failed: whatsappResult.failed } : null,
        emailStats: emailResult ? { sent: emailResult.sent, failed: emailResult.failed } : null,
      },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'SUCCESS',
    })

    const saved = await Notice.findById(notice._id).lean()

    const response: NoticeCreateResponse = {
      notice: saved as any,
      sms: smsResult,
      whatsapp: whatsappResult,
      email: emailResult,
      push: pushResult,
      warning:
        smsResult?.skipReason ||
        whatsappResult?.skipReason ||
        emailResult?.skipReason ||
        smsResult?.creditError ||
        whatsappResult?.creditError ||
        emailResult?.creditError ||
        undefined,
    }

    return NextResponse.json(response, { status: 201 })

  } catch (err: any) {
    console.error('Notice POST error:', err)

    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'CREATE',
      resource: 'Notice',
      description: `Failed to create notice: ${err.message}`,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'FAILURE',
    })

    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Failed to create notice' },
      { status: 500 }
    )
  }
}
