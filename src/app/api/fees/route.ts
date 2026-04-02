// FILE: src/app/api/fees/route.ts
// UPDATED: Fee reminder via credit system added
// BACKWARD COMPATIBLE — GET same, POST adds reminder
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { sendMessage, sendBulkMessages } from '@/lib/messaging'
import { SMS_TEMPLATES } from '@/lib/sms'
import { checkCredits } from '@/lib/credits'

// ── GET — same as before ──
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const status = req.nextUrl.searchParams.get('status')
    const cls = req.nextUrl.searchParams.get('class')
    const search = req.nextUrl.searchParams.get('search')

    const query: any = { tenantId: session.user.tenantId }
    if (status) query.status = status

    let studentIdFilter: string[] | null = null
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' }

      const matchedUsers = await User.find({
        tenantId: session.user.tenantId,
        role: 'student',
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      })
        .select('_id')
        .lean()

      const userIds = matchedUsers.map(u => u._id)

      const matchedStudents = await Student.find({
        tenantId: session.user.tenantId,
        $or: [
          { admissionNo: searchRegex },
          ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
        ],
      })
        .select('_id')
        .lean()

      studentIdFilter = matchedStudents.map(s => s._id.toString())

      if (studentIdFilter.length === 0) {
        return NextResponse.json({ fees: [] })
      }
      query.studentId = { $in: studentIdFilter }
    }

    let fees = await Fee.find(query)
      .populate({
        path: 'studentId',
        select: 'admissionNo class section parentPhone phone name',
        populate: { path: 'userId', select: 'name phone' },
      })
      .populate('structureId', 'name term')
      .sort({ dueDate: 1 })
      .lean()

    if (cls) {
      fees = fees.filter((f: any) => f.studentId?.class === cls)
    }

    return NextResponse.json({ fees })
  } catch (err: any) {
    console.error('Fees GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST — Send fee reminders via credit system ──
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()

    // ── Fee reminder blast ──
    if (body.action === 'send_reminders') {
      const {
        feeIds,
        channel = 'sms',
        customMessage,
      } = body

      // Get pending fees
      const pendingFees = await Fee.find({
        tenantId: session.user.tenantId,
        status: { $in: ['pending', 'overdue'] },
        ...(feeIds?.length ? { _id: { $in: feeIds } } : {}),
      })
        .populate({
          path: 'studentId',
          select: 'parentPhone phone parentEmail email name',
          populate: { path: 'userId', select: 'name phone email' },
        })
        .lean() as any[]

      if (pendingFees.length === 0) {
        return NextResponse.json(
          { error: 'Koi pending fee nahi mili' },
          { status: 400 }
        )
      }

      // Check credits
      const creditCheck = await checkCredits(
        session.user.tenantId,
        channel,
        pendingFees.length
      )

      if (!creditCheck.canSend) {
        return NextResponse.json(
          {
            error: creditCheck.message,
            code: 'INSUFFICIENT_CREDITS',
            balance: creditCheck.balance,
            required: creditCheck.required,
          },
          { status: 402 }
        )
      }

      // Build recipients
      const recipients = pendingFees
        .map(fee => {
          const student = fee.studentId as any
          const studentName =
            student?.userId?.name || student?.name || 'Student'
          const phone =
            student?.parentPhone || student?.phone || student?.userId?.phone
          const email =
            student?.parentEmail || student?.email || student?.userId?.email
          const recipient = channel === 'email' ? email : phone

          if (!recipient) return null

          const amount = fee.amount || fee.totalAmount || 0
          const dueDate = fee.dueDate
            ? new Date(fee.dueDate).toLocaleDateString('en-IN')
            : 'As soon as possible'

          const message =
            customMessage ||
            SMS_TEMPLATES.feeReminder(studentName, amount, dueDate)

          return {
            recipient,
            recipientName: studentName,
            message,
          }
        })
        .filter(Boolean) as Array<{
          recipient: string
          recipientName: string
          message: string
        }>

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: 'Kisi bhi student ka contact nahi mila' },
          { status: 400 }
        )
      }

      // Send bulk
      const result = await sendBulkMessages({
        tenantId: session.user.tenantId,
        channel,
        purpose: 'fee_reminder',
        recipients,
        sentBy: session.user.id,
        sentByName: session.user.name,
        subject: 'Fee Payment Reminder',
      })

      return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        creditsUsed: result.creditsUsed,
        lowCreditWarning: creditCheck.lowCreditWarning,
      })
    }

    // ── Single fee reminder ──
    if (body.action === 'send_single_reminder') {
      const { feeId, channel = 'sms' } = body

      const fee = await Fee.findOne({
        _id: feeId,
        tenantId: session.user.tenantId,
      })
        .populate({
          path: 'studentId',
          select: 'parentPhone phone parentEmail email name',
          populate: { path: 'userId', select: 'name phone email' },
        })
        .lean() as any

      if (!fee) {
        return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
      }

      const student = fee.studentId as any
      const studentName = student?.userId?.name || student?.name || 'Student'
      const phone = student?.parentPhone || student?.phone
      const email = student?.parentEmail || student?.email
      const recipient = channel === 'email' ? email : phone

      if (!recipient) {
        return NextResponse.json(
          { error: 'Student ka contact nahi mila' },
          { status: 400 }
        )
      }

      const amount = fee.amount || fee.totalAmount || 0
      const dueDate = fee.dueDate
        ? new Date(fee.dueDate).toLocaleDateString('en-IN')
        : 'ASAP'

      const result = await sendMessage({
        tenantId: session.user.tenantId,
        channel,
        purpose: 'fee_reminder',
        recipient,
        recipientName: studentName,
        message: SMS_TEMPLATES.feeReminder(studentName, amount, dueDate),
        sentBy: session.user.id,
        sentByName: session.user.name,
        metadata: { feeId: fee._id.toString(), amount, dueDate },
      })

      return NextResponse.json({
        success: result.success,
        creditsUsed: result.creditsUsed,
        error: result.error,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err: any) {
    console.error('Fees POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}