// FILE: src/app/api/ai/admin-commands/route.ts
// Execute admin commands from AI chat
// UPDATED: @/lib/messaging → @/lib/message (correct import)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { Attendance } from '@/models/Attendance'
import { Notice } from '@/models/Notice'
import { Fee } from '@/models/Fee'
import { User } from '@/models/User'
import { sendBulkMessages } from '@/lib/message'          // ✅ Fix: @/lib/messaging → @/lib/message
import { getTodayDateString } from '@/lib/date-helpers'

export async function POST(req: NextRequest) {
  try {
    // ── Security: Internal AI call check ──────────────────
    const isInternalAI =
      req.headers.get('x-internal-ai') === 'true'

    let tenantId: string
    let userId: string
    let userName: string

    if (isInternalAI) {
      const body = await req.json()
      tenantId = body.tenant_id

      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenant_id required' },
          { status: 400 }
        )
      }

      await connectDB()

      const adminUser = await User.findOne({
        tenantId,
        role: 'admin',
        isActive: true,
      })
        .select('_id name')
        .lean() as any

      userId = adminUser?._id?.toString() || ''
      userName = adminUser?.name || 'AI Command'

      return await executeCommand(body, tenantId, userId, userName)
    }

    // ── Regular Session Check ─────────────────────────────
    const session = await getServerSession(authOptions)

    if (
      !session?.user ||
      !['admin', 'staff'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    tenantId = session.user.tenantId
    userId = session.user.id
    userName = session.user.name || 'Admin'

    await connectDB()

    const body = await req.json()
    return await executeCommand(body, tenantId, userId, userName)

  } catch (error) {
    console.error('[AI Commands] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Command execution failed' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════
// Execute Command
// ══════════════════════════════════════════════════════════

async function executeCommand(
  body: any,
  tenantId: string,
  userId: string,
  userName: string
): Promise<NextResponse> {
  const { command, params } = body

  console.log(
    `🤖 [AI Command] ${command} | Tenant: ${tenantId.slice(-6)}`
  )

  switch (command) {

    // ── Send Absent SMS ──────────────────────────────────
    case 'send_absent_sms': {
      const date = params.date || getTodayDateString()
      const cls = params.class
      const section = params.section

      // Absent attendance records fetch karo
      const filter: any = {
        tenantId,
        date,
        status: 'absent',
      }

      if (cls) {
        const studentFilter: any = {
          tenantId,
          status: 'active',
          class: cls,
        }
        if (section) studentFilter.section = section

        const students = await Student.find(studentFilter)
          .select('_id')
          .lean()

        const studentIds = students.map(s => s._id)
        filter.studentId = { $in: studentIds }
      }

      const absentRecords = await Attendance.find(filter)
        .populate({
          path: 'studentId',
          select: 'parentPhone class section userId',
          populate: { path: 'userId', select: 'name' },
        })
        .lean()

      const recipients = absentRecords
        .map((r: any) => {
          const student = r.studentId
          const phone = student?.parentPhone
          const name = student?.userId?.name || 'Student'

          if (!phone) return null

          return {
            recipient: phone,
            recipientName: name,
            // ✅ Plain text message — resend.ts handle karega
            message: `${name} was ABSENT on ${date}. Please contact school if needed. -Skolify`,
          }
        })
        .filter(Boolean) as Array<{
          recipient: string
          recipientName: string
          message: string
        }>

      if (recipients.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          message: 'No absent students found or no phone numbers available',
        })
      }

      const result = await sendBulkMessages({
        tenantId,
        channel: 'sms',
        purpose: 'attendance_absent',
        recipients,
        sentBy: userId,
        sentByName: userName,
      })

      return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        creditsUsed: result.creditsUsed,
      })
    }

    // ── Send Fee Reminder ────────────────────────────────
    case 'send_fee_reminder': {
      const channel = (params.channel || 'sms') as
        'sms' | 'whatsapp' | 'email'
      const cls = params.class
      const message = params.message || (
        'Dear Parent, fee payment is due for your child. ' +
        'Please pay at the earliest to avoid late fine. ' +
        'Login to portal for details. -Skolify'
      )

      // Pending fees fetch karo
      const feeFilter: any = {
        tenantId,
        status: { $in: ['pending', 'partial'] },
      }

      const pendingFees = await Fee.find(feeFilter)
        .populate({
          path: 'studentId',
          select: 'parentPhone class section userId',
          populate: { path: 'userId', select: 'name' },
        })
        .lean()

      // Deduplicate by parent phone
      const phoneSet = new Set<string>()

      const recipients = pendingFees
        .map((f: any) => {
          const student = f.studentId
          if (!student) return null

          const phone = student.parentPhone
          const name = student.userId?.name || 'Student'

          if (!phone) return null
          if (phoneSet.has(phone)) return null
          if (cls && student.class !== cls) return null

          phoneSet.add(phone)

          return {
            recipient: phone,
            recipientName: name,
            message,
          }
        })
        .filter(Boolean) as Array<{
          recipient: string
          recipientName: string
          message: string
        }>

      if (recipients.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          message: 'No pending fee students found',
        })
      }

      const result = await sendBulkMessages({
        tenantId,
        channel,
        purpose: 'fee_reminder',
        recipients,
        sentBy: userId,
        sentByName: userName,
      })

      return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        creditsUsed: result.creditsUsed,
      })
    }

    // ── Create Notice ────────────────────────────────────
    case 'create_notice': {
      const title = params.title || 'Important Notice'
      const content = params.content || ''
      const targetRole = params.targetRole || 'all'
      const targetClass = params.targetClass
      const priority = params.priority || 'normal'

      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Notice content required' },
          { status: 400 }
        )
      }

      const notice = await Notice.create({
        tenantId,
        title,
        content,
        targetRole,
        targetClass: targetClass || undefined,
        priority,
        publishedAt: new Date(),
        createdBy: userId,
        isActive: true,
        smsSent: false,
        pushSent: false,
        smsCount: 0,
      })

      return NextResponse.json({
        success: true,
        noticeId: notice._id.toString(),
        title,
        targetRole,
      })
    }

    // ── Unknown Command ──────────────────────────────────
    default:
      return NextResponse.json(
        { success: false, error: `Unknown command: ${command}` },
        { status: 400 }
      )
  }
}