/* ============================================================
   FILE: src/app/api/attendance/report/route.ts
   FIX: Explicit types for lean + populated queries
   ============================================================ */

import { NextRequest, NextResponse }  from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import { connectDB }                  from '@/lib/db'
import { Attendance }                 from '@/models/Attendance'
import { Student }                    from '@/models/Student'
import { attendanceReportSchema }     from '@/lib/validators/attendance'
import mongoose                       from 'mongoose'

// ── Types ────────────────────────────────────────────────────

interface StudentLeanForReport {
  _id:         mongoose.Types.ObjectId
  rollNo:      string
  class:       string
  section:     string
  admissionNo: string
  userId?:     {
    _id:  mongoose.Types.ObjectId
    name: string
  }
}

// ── Helpers ──────────────────────────────────────────────────

function errRes(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status })
}

// ════════════════════════════════════════════════════════════
// GET /api/attendance/report
// ════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return errRes('Unauthorized', 401)

  // ── Validate ──
  const raw    = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = attendanceReportSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:   'Invalid parameters',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { month, studentId, class: cls, section } = parsed.data

  try {
    await connectDB()

    const [year, mon] = month.split('-')
    const startDate   = `${year}-${mon.padStart(2, '0')}-01`
    const endDate     = `${year}-${mon.padStart(2, '0')}-31`

    // ── Single student report ──────────────────────────────
    if (studentId) {
      // Verify student
      // ✅ FIX: Explicit type
      const student = await Student
        .findOne({
          _id:      studentId,
          tenantId: session.user.tenantId,
        })
        .populate<{ userId: { name: string } }>('userId', 'name')
        .select('rollNo class section admissionNo userId')
        .lean() as unknown as StudentLeanForReport | null

      if (!student) return errRes('Student not found', 404)

      const stats = await Attendance.getMonthlyStats(
        session.user.tenantId,
        studentId,
        month
      )

      return NextResponse.json({
        report: [{
          student: {
            _id:         studentId,
            name:        student.userId?.name ?? 'Unknown',
            rollNo:      student.rollNo,
            class:       student.class,
            section:     student.section,
            admissionNo: student.admissionNo,
          },
          ...stats,
          lowAttendance: stats.percentage < 75,
        }],
        month,
      })
    }

    // ── Class-level report ─────────────────────────────────

    const matchStage: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(session.user.tenantId),
      date:     { $gte: startDate, $lte: endDate },
    }

    // Class filter
    if (cls) {
      const studentFilter: Record<string, unknown> = {
        tenantId: new mongoose.Types.ObjectId(session.user.tenantId),
        class:    cls,
        status:   'active',
      }
      if (section) studentFilter.section = section

      const classStudents = await Student
        .find(studentFilter)
        .select('_id')
        .lean()

      if (!classStudents.length) {
        return NextResponse.json({ report: [], month })
      }

      matchStage.studentId = { $in: classStudents.map(s => s._id) }
    } else {
      // Tenant-wide — admin only
      if (!['admin', 'superadmin'].includes(session.user.role)) {
        return errRes('Class filter required for this role', 400)
      }
    }

    // ── Aggregation pipeline ──
    const report = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:      '$studentId',
          present:  { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent:   { $sum: { $cond: [{ $eq: ['$status', 'absent'] },  1, 0] } },
          late:     { $sum: { $cond: [{ $eq: ['$status', 'late'] },    1, 0] } },
          holiday:  { $sum: { $cond: [{ $eq: ['$status', 'holiday'] }, 1, 0] } },
          total:    { $sum: 1 },
        },
      },
      {
        $lookup: {
          from:         'students',
          localField:   '_id',
          foreignField: '_id',
          as:           'studentDoc',
        },
      },
      { $unwind: '$studentDoc' },
      {
        $lookup: {
          from:         'users',
          localField:   'studentDoc.userId',
          foreignField: '_id',
          as:           'userDoc',
        },
      },
      {
        $unwind: {
          path:                       '$userDoc',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          student: {
            _id:         '$_id',
            name:        '$userDoc.name',
            rollNo:      '$studentDoc.rollNo',
            class:       '$studentDoc.class',
            section:     '$studentDoc.section',
            admissionNo: '$studentDoc.admissionNo',
            parentPhone: '$studentDoc.parentPhone',
          },
          present:  1,
          absent:   1,
          late:     1,
          holiday:  1,
          total:    1,
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $add: ['$present', '$late'] },
                          '$total',
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
          lowAttendance: {
            $cond: [
              { $gt: ['$total', 0] },
              {
                $lt: [
                  { $divide: [{ $add: ['$present', '$late'] }, '$total'] },
                  0.75,
                ],
              },
              false,
            ],
          },
        },
      },
      { $sort: { 'student.rollNo': 1 } },
    ])

    return NextResponse.json({ report, month })
  } catch (err) {
    console.error('[GET /api/attendance/report]', err)
    return errRes('Internal server error', 500)
  }
}