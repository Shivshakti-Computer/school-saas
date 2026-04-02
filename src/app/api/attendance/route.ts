// FILE: src/app/api/attendance/route.ts
// UPDATED: Absent SMS via credit system
// BACKWARD COMPATIBLE — same GET/POST structure
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { Student } from '@/models/Student'
import { User } from '@/models'
import { sendMessage } from '@/lib/messaging'
import { SMS_TEMPLATES } from '@/lib/sms'
import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'
import { checkCredits } from '@/lib/credits'

interface AttendanceRecordInput {
  studentId: string
  status: 'present' | 'absent' | 'late' | 'pending'
}

// ── GET — same as before ──
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['admin', 'teacher', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { searchParams } = req.nextUrl
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const cls = searchParams.get('class')
  const section = searchParams.get('section')

  if (!cls) {
    return NextResponse.json({ error: 'class required' }, { status: 400 })
  }

  const students = await Student.find({
    tenantId: session.user.tenantId,
    class: cls,
    section: section || { $exists: true },
    status: 'active',
  })
    .populate('userId', 'name')
    .sort({ rollNo: 1 })
    .lean()

  const records = await Attendance.find({
    tenantId: session.user.tenantId,
    date,
    studentId: { $in: students.map(s => s._id) },
  }).lean()

  const recordMap = new Map(records.map(r => [r.studentId.toString(), r]))

  const list = students.map(s => ({
    studentId: s._id,
    admissionNo: s.admissionNo,
    rollNo: s.rollNo,
    name: (s.userId as any)?.name || '',
    status: recordMap.get(s._id.toString())?.status || 'pending',
    attendanceId: recordMap.get(s._id.toString())?._id || null,
  }))

  return NextResponse.json({ list, date, total: list.length })
}

// ── POST — credit system integrated ──
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['admin', 'teacher', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { date, records, subject, sendAbsentSms = true } = (await req.json()) as {
    date: string
    records: AttendanceRecordInput[]
    subject?: string
    sendAbsentSms?: boolean
  }

  if (!date || !records?.length) {
    return NextResponse.json({ error: 'date and records required' }, { status: 400 })
  }

  // ── Bulk upsert attendance ──
  const ops = records.map(r => ({
    updateOne: {
      filter: {
        tenantId: session.user.tenantId,
        studentId: r.studentId,
        date,
        ...(subject ? { subject } : {}),
      },
      update: {
        $set: {
          status: r.status,
          markedBy: session.user.id,
          tenantId: session.user.tenantId,
          ...(subject ? { subject } : {}),
        },
      },
      upsert: true,
    },
  }))

  await Attendance.bulkWrite(ops)

  // ── Absent students SMS ──
  const absentIds = records
    .filter(r => r.status === 'absent')
    .map(r => r.studentId)

  let smsSent = 0
  let smsSkipped = 0
  let smsFailReason = ''

  if (absentIds.length > 0 && sendAbsentSms) {
    // Check credits first (1 credit per SMS)
    const creditCheck = await checkCredits(
      session.user.tenantId,
      'sms',
      absentIds.length
    )

    if (!creditCheck.canSend) {
      // Log skip reason but don't fail the attendance save
      smsSkipped = absentIds.length
      smsFailReason = `Insufficient credits (${creditCheck.balance} available, ${creditCheck.required} required)`
      console.warn(`[Attendance] SMS skipped — ${smsFailReason}`)
    } else {
      // Get absent students
      const absentStudents = await Student.find({
        _id: { $in: absentIds },
        tenantId: session.user.tenantId,
      }).lean()

      for (const s of absentStudents) {
        // Check if SMS already sent today
        const alreadySent = await Attendance.findOne({
          studentId: s._id,
          date,
          smsSent: true,
        })
        if (alreadySent) continue

        const phone = (s as any).parentPhone || (s as any).phone
        if (!phone) continue

        const studentName = (s as any).name || 'Student'
        const message = SMS_TEMPLATES.absentAlert(
          studentName,
          date,
          session.user.schoolName
        )

        // ← Send via credit system
        const result = await sendMessage({
          tenantId: session.user.tenantId,
          channel: 'sms',
          purpose: 'attendance_absent',
          recipient: phone,
          recipientName: studentName,
          message,
          sentBy: session.user.id,
          sentByName: session.user.name,
          metadata: {
            studentId: s._id.toString(),
            date,
            class: (s as any).class,
          },
        })

        if (result.success) {
          // Mark SMS sent in attendance record
          await Attendance.updateOne(
            { studentId: s._id, date },
            { $set: { smsSent: true } }
          )
          smsSent++
        } else if (result.skipped) {
          smsSkipped++
          smsFailReason = result.skipReason || 'Credits insufficient'
          break // Stop if credits run out
        }
      }
    }
  }

  // ── Push notifications for absent students ──
  const absentRecords = records.filter(r => r.status === 'absent')
  for (const r of absentRecords) {
    try {
      const student = await Student.findById(r.studentId)
        .populate('userId', 'name')
        .lean() as any

      const parentUser = await User.findOne({
        tenantId: session.user.tenantId,
        studentRef: r.studentId,
        role: 'parent',
      })

      if (parentUser?.pushSubscription) {
        await sendPushToUser(
          parentUser.pushSubscription,
          PUSH_TEMPLATES.attendanceMarked(
            student?.userId?.name ?? 'Student',
            'absent'
          )
        ).catch(console.error)
      }
    } catch (pushErr) {
      console.error('Push notification error (non-critical):', pushErr)
    }
  }

  return NextResponse.json({
    success: true,
    saved: records.length,
    absent: absentIds.length,
    sms: {
      sent: smsSent,
      skipped: smsSkipped,
      failReason: smsFailReason || undefined,
      // Show warning if credits were insufficient
      creditWarning: smsSkipped > 0
        ? `${smsSkipped} SMS skip hue — ${smsFailReason}. Credit pack kharido.`
        : undefined,
    },
  })
}