/* ============================================================
   FILE: src/app/api/attendance/route.ts
   UPDATED: Stream filter support + explicit types
   ============================================================ */

import { NextRequest, NextResponse }  from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import { connectDB }                  from '@/lib/db'
import { Attendance }                 from '@/models/Attendance'
import { Student }                    from '@/models/Student'
import { User }                       from '@/models'
import { PUSH_TEMPLATES, sendPushToUser } from '@/lib/push'
import { checkCredits }               from '@/lib/credits'
import {
  attendanceGetSchema,
  attendancePostSchema,
  type AttendancePostInput,
}                                     from '@/lib/validators/attendance'
import mongoose                       from 'mongoose'
import type { IAttendanceLean }       from '@/models/Attendance'
import { sendMessage, SMS_TEMPLATES } from '@/lib/message'

// ── Types for populated lean queries ────────────────────────

interface StudentLeanPopulated {
  _id:         mongoose.Types.ObjectId
  admissionNo: string
  rollNo:      string
  class:       string
  section:     string
  stream?:     string  // ✅ Added
  parentPhone: string
  userId:      {
    _id:  mongoose.Types.ObjectId
    name: string
  }
}

interface StudentLeanBasic {
  _id:         mongoose.Types.ObjectId
  parentPhone: string
  class:       string
  section:     string
}

// ── Helpers ──────────────────────────────────────────────────

const ALLOWED_ROLES = ['admin', 'teacher', 'staff'] as const
type AllowedRole    = typeof ALLOWED_ROLES[number]

// Classes eligible for stream
const STREAM_CLASSES = ['11', '12']

function isAllowed(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role)
}

function errRes(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

// ════════════════════════════════════════════════════════════
// GET /api/attendance
// Query: ?class=11&section=A&stream=science&date=2025-01-15
// ════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAllowed(session.user.role)) {
    return errRes('Unauthorized', 401)
  }

  // ── Validate ──
  const raw    = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = attendanceGetSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:   'Invalid parameters',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { class: cls, section, stream, date } = parsed.data
  const attendanceDate = date ?? new Date().toISOString().split('T')[0]

  try {
    await connectDB()

    // ── Student query with stream filter ──
    const studentFilter: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      class:    cls,
      status:   'active',
    }
    if (section) studentFilter.section = section

    // ✅ Stream filter at DB level (for Class 11, 12 only)
    if (stream && STREAM_CLASSES.includes(cls)) {
      // Student model normalizes stream to lowercase via pre-save hook
      studentFilter.stream = stream.toLowerCase()
    }

    // ✅ Select stream field
    const students = await Student
      .find(studentFilter)
      .populate<{ userId: { _id: mongoose.Types.ObjectId; name: string } }>(
        'userId',
        'name'
      )
      .select('_id admissionNo rollNo class section stream parentPhone userId')  // ← stream added
      .sort({ rollNo: 1 })
      .lean() as unknown as StudentLeanPopulated[]

    if (!students.length) {
      return NextResponse.json({
        list:  [],
        date:  attendanceDate,
        total: 0,
        meta: {
          class:   cls,
          section: section ?? null,
          stream:  stream ?? null,  // ✅ Added
          present: 0,
          absent:  0,
          late:    0,
          pending: 0,
        },
      })
    }

    // ── Existing attendance records ──
    const existingRecords = await Attendance
      .find({
        tenantId:  session.user.tenantId,
        date:      attendanceDate,
        studentId: { $in: students.map(s => s._id) },
      })
      .lean() as unknown as IAttendanceLean[]

    const recordMap = new Map<string, IAttendanceLean>(
      existingRecords.map(r => [r.studentId.toString(), r])
    )

    // ── Build list ──
    const list = students.map(s => {
      const existing = recordMap.get(s._id.toString())
      return {
        studentId:    s._id.toString(),
        admissionNo:  s.admissionNo,
        rollNo:       s.rollNo,
        name:         s.userId?.name ?? 'Unknown',
        parentPhone:  s.parentPhone,
        class:        s.class,
        section:      s.section,
        stream:       s.stream ?? '',  // ✅ Include stream
        status:       existing?.status ?? 'pending',
        attendanceId: existing?._id?.toString() ?? null,
        smsSent:      existing?.smsSent ?? false,
      }
    })

    // ── Stats ──
    const presentCount = list.filter(r => r.status === 'present').length
    const absentCount  = list.filter(r => r.status === 'absent').length
    const lateCount    = list.filter(r => r.status === 'late').length
    const pendingCount = list.filter(r => r.status === 'pending').length

    return NextResponse.json({
      list,
      date:  attendanceDate,
      total: list.length,
      meta: {
        class:   cls,
        section: section ?? null,
        stream:  stream ?? null,  // ✅ Added
        present: presentCount,
        absent:  absentCount,
        late:    lateCount,
        pending: pendingCount,
      },
    })
  } catch (err) {
    console.error('[GET /api/attendance]', err)
    return errRes('Internal server error', 500)
  }
}

// ════════════════════════════════════════════════════════════
// POST /api/attendance
// ════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAllowed(session.user.role)) {
    return errRes('Unauthorized', 401)
  }

  // ── Parse body ──
  let body: AttendancePostInput
  try {
    const raw    = await req.json()
    const parsed = attendancePostSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:   'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return errRes('Invalid JSON body', 400)
  }

  const { date, records, subject, sendAbsentSms } = body

  // ── Filter pending ──
  const validRecords = records.filter(r => r.status !== ('pending' as string))

  if (!validRecords.length) {
    return errRes('No valid records — all are pending', 400)
  }

  try {
    await connectDB()

    // ── Verify all studentIds belong to this tenant ──
    const studentIds = validRecords.map(r => r.studentId)

    const verifiedStudents = await Student
      .find({
        _id:      { $in: studentIds },
        tenantId: session.user.tenantId,
        status:   'active',
      })
      .select('_id parentPhone class section')
      .lean() as unknown as StudentLeanBasic[]

    const verifiedIds = new Set(verifiedStudents.map(s => s._id.toString()))

    // Filter tampering attempts
    const safeRecords = validRecords.filter(r => verifiedIds.has(r.studentId))

    if (!safeRecords.length) {
      return errRes('No valid students found for this tenant', 400)
    }

    // ── Bulk upsert ──
    const ops = safeRecords.map(r => ({
      updateOne: {
        filter: {
          tenantId:  session.user.tenantId,
          studentId: r.studentId,
          date,
          ...(subject ? { subject } : {}),
        },
        update: {
          $set: {
            status:   r.status,
            markedBy: session.user.id,
            tenantId: session.user.tenantId,
            ...(subject ? { subject } : {}),
          },
          $setOnInsert: {
            smsSent: false,
          },
        },
        upsert: true,
      },
    }))

    const bulkResult = await Attendance.bulkWrite(ops as any, { ordered: false })

    // ── SMS for absent students ──────────────────────────────

    const absentStudentIds = safeRecords
      .filter(r => r.status === 'absent')
      .map(r => r.studentId)

    const smsResult = {
      sent:          0,
      skipped:       0,
      failReason:    '',
      creditWarning: undefined as string | undefined,
    }

    if (absentStudentIds.length > 0 && sendAbsentSms) {
      // Credit check
      const creditCheck = await checkCredits(
        session.user.tenantId,
        'sms',
        absentStudentIds.length
      )

      if (!creditCheck.canSend) {
        smsResult.skipped      = absentStudentIds.length
        smsResult.failReason   = `Insufficient credits (${creditCheck.balance} available, ${creditCheck.required} required)`
        smsResult.creditWarning = `${absentStudentIds.length} SMS not sent — ${smsResult.failReason}. Purchase credit pack.`
        console.warn('[Attendance POST] SMS skipped —', smsResult.failReason)
      } else {
        // Build phone map
        const studentPhoneMap = new Map(
          verifiedStudents.map(s => [s._id.toString(), s.parentPhone])
        )

        for (const studentId of absentStudentIds) {
          // Already sent today?
          const alreadySent = await Attendance.findOne({
            studentId,
            date,
            smsSent: true,
          })
            .select('_id')
            .lean()

          if (alreadySent) continue

          const phone = studentPhoneMap.get(studentId)
          if (!phone) {
            smsResult.skipped++
            continue
          }

          // Get student name
          const studentDoc = await Student
            .findById(studentId)
            .populate<{ userId: { name: string } }>('userId', 'name')
            .select('userId class')
            .lean() as unknown as {
              userId?: { name: string }
              class?:  string
            }

          const studentName  = studentDoc?.userId?.name ?? 'Student'
          const studentClass = studentDoc?.class ?? ''

          const message = SMS_TEMPLATES.absentAlert(
            studentName,
            date,
            session.user.schoolName
          )

          const result = await sendMessage({
            tenantId:      session.user.tenantId,
            channel:       'sms',
            purpose:       'attendance_absent',
            recipient:     phone,
            recipientName: studentName,
            message,
            sentBy:        session.user.id,
            sentByName: session.user.name ?? undefined,
            metadata: {
              studentId,
              date,
              class: studentClass,
            },
          })

          if (result.success) {
            await Attendance.updateOne(
              { studentId, date, tenantId: session.user.tenantId },
              { $set: { smsSent: true } }
            )
            smsResult.sent++
          } else if (result.skipped) {
            smsResult.skipped++
            smsResult.failReason    = result.skipReason ?? 'Credits insufficient'
            smsResult.creditWarning = `SMS stopped — ${smsResult.failReason}`
            break
          }
        }
      }
    }

    // ── Push Notifications — fire & forget ──────────────────

    const absentRecords = safeRecords.filter(r => r.status === 'absent')

    Promise.allSettled(
      absentRecords.map(async r => {
        try {
          const student = await Student
            .findById(r.studentId)
            .populate<{ userId: { name: string } }>('userId', 'name')
            .select('userId')
            .lean() as unknown as { userId?: { name: string } }

          const parentUser = await User.findOne({
            tenantId:   session.user.tenantId,
            studentRef: r.studentId,
            role:       'parent',
          })
            .select('pushSubscription')
            .lean()

          if (parentUser?.pushSubscription) {
            await sendPushToUser(
              parentUser.pushSubscription,
              PUSH_TEMPLATES.attendanceMarked(
                student?.userId?.name ?? 'Student',
                'absent'
              )
            )
          }
        } catch (pushErr) {
          console.error('[Attendance POST] Push error:', pushErr)
        }
      })
    )

    // ── Response ──────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      saved:   safeRecords.length,
      absent:  absentStudentIds.length,
      stats: {
        upserted: bulkResult.upsertedCount,
        modified: bulkResult.modifiedCount,
      },
      sms: {
        sent:          smsResult.sent,
        skipped:       smsResult.skipped,
        failReason:    smsResult.failReason   || undefined,
        creditWarning: smsResult.creditWarning,
      },
    })
  } catch (err) {
    console.error('[POST /api/attendance]', err)
    return errRes('Internal server error', 500)
  }
}