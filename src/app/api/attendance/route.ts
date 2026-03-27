/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/attendance/route.ts
   GET  → fetch attendance for class+date
   POST → bulk save attendance
   ─────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, withTenant } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { Student } from '@/models/Student'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'
import { User } from '@/models'
import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const cls = searchParams.get('class')
  const section = searchParams.get('section')

  if (!cls) return NextResponse.json({ error: 'class required' }, { status: 400 })

  const students = await Student.find({
    tenantId: session.user.tenantId,
    class: cls,
    section: section || { $exists: true },
    status: 'active',
  }).populate('userId', 'name').sort({ rollNo: 1 }).lean()

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { date, records, subject } = await req.json()
  // records: [{ studentId: string, status: 'present'|'absent'|'late' }]

  if (!date || !records?.length) {
    return NextResponse.json({ error: 'date and records required' }, { status: 400 })
  }

  // Bulk upsert
  const ops = records.map((r: any) => ({
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

  // SMS to absent students' parents (only once per day)
  const absentIds = records
    .filter((r: any) => r.status === 'absent')
    .map((r: any) => r.studentId)

  if (absentIds.length > 0) {
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

      const name = s.fatherName ? `${(s as any).name || 'Student'}` : 'Student'
      await sendSMS(
        s.parentPhone,
        SMS_TEMPLATES.absentAlert(name, date, session.user.schoolName)
      )
      await Attendance.updateOne(
        { studentId: s._id, date },
        { $set: { smsSent: true } }
      )
    }
  }


  // Push Notification for absent
  const absentRecords = records.filter(r => r.status === 'absent')
  for (const r of absentRecords) {
    const student = await Student.findById(r.studentId)
      .populate('userId', 'name').lean() as any
    const parentUser = await User.findOne({
      tenantId: session.user.tenantId,
      studentRef: r.studentId,
      role: 'parent',
      pushEnabled: true,
    })
    if (parentUser?.pushSubscription) {
      await sendPushToUser(
        parentUser.pushSubscription,
        PUSH_TEMPLATES.attendanceMarked(student?.userId?.name ?? 'Student', 'absent')
      ).catch(console.error)
    }
  }

  return NextResponse.json({ success: true, saved: records.length })
}