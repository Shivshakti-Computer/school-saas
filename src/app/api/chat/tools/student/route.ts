// src/app/api/chat/tools/student/route.ts
// UPDATED: 2026-04-06
// - Fixed Student→User relationship (userId reference)
// - Fixed date handling (STRING for Attendance)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Student } from '@/models/Student'
import { Attendance } from '@/models/Attendance'
import { Fee } from '@/models/Fee'
import { Notice } from '@/models/Notice'
import { Homework } from '@/models/Homework'
import { connectDB } from '@/lib/db'
import { getTodayDateString, getDateRange } from '@/lib/date-helpers'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Student access required' },
        { status: 403 }
      )
    }

    const tenantId = (session.user as any)?.tenantId
    const userId = session.user.id

    await connectDB()

    // ✅ FIX: Find student by userId (direct reference)
    const student = await Student.findOne({
      tenantId,
      userId,
    }).lean() as any

    if (!student) {
      return NextResponse.json({
        success: true,
        data: { message: 'Student profile not found. Contact school admin.' },
      })
    }

    const body = await req.json()
    const { tool } = body

    switch (tool) {

      // ── My Attendance ─────────────────────────────────────
      case 'get_my_attendance': {
        // ✅ FIX: STRING date format
        const todayStr = getTodayDateString()
        const { start, end } = getDateRange(30)

        const [present, absent, late] = await Promise.all([
          Attendance.countDocuments({
            tenantId,
            studentId: student._id,
            date: { $gte: start, $lte: end },
            status: 'present',
          }),
          Attendance.countDocuments({
            tenantId,
            studentId: student._id,
            date: { $gte: start, $lte: end },
            status: 'absent',
          }),
          Attendance.countDocuments({
            tenantId,
            studentId: student._id,
            date: { $gte: start, $lte: end },
            status: 'late',
          }),
        ])

        const todayRecord = await Attendance.findOne({
          tenantId,
          studentId: student._id,
          date: todayStr,
        }).lean() as any

        const total = present + absent + late
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0

        return NextResponse.json({
          success: true,
          data: {
            period: 'Last 30 days',
            present,
            absent,
            late,
            attendance_percentage: `${percentage}%`,
            today_status: todayRecord?.status || 'Not marked yet',
            remark:
              percentage >= 75
                ? '✅ Good attendance! Keep it up!'
                : percentage >= 60
                  ? '⚠️ Attendance is low. Try to be regular.'
                  : '🚨 Critical! Below 60%. Talk to your teacher.',
          },
        })
      }

      // ── My Fees ───────────────────────────────────────────
      case 'get_my_fees': {
        const [pendingFees, paidFees] = await Promise.all([
          Fee.find({
            tenantId,
            studentId: student._id,
            status: { $in: ['pending', 'partial'] },
          })
            .sort({ dueDate: 1 })
            .select('finalAmount paidAmount dueDate status')
            .lean(),
          Fee.find({
            tenantId,
            studentId: student._id,
            status: 'paid',
          })
            .sort({ paidAt: -1 })
            .limit(3)
            .select('paidAmount paidAt')
            .lean(),
        ])

        const totalPending = pendingFees.reduce(
          (sum: number, f: any) =>
            sum + ((f.finalAmount || 0) - (f.paidAmount || 0)),
          0
        )

        return NextResponse.json({
          success: true,
          data: {
            pending_count: pendingFees.length,
            total_pending: `₹${totalPending.toLocaleString('en-IN')}`,
            pending_fees: pendingFees.map((f: any) => ({
              amount: `₹${((f.finalAmount || 0) - (f.paidAmount || 0)).toLocaleString('en-IN')}`,
              due_date: f.dueDate
                ? new Date(f.dueDate).toLocaleDateString('en-IN')
                : 'N/A',
              status: f.status,
            })),
            recent_paid: paidFees.map((f: any) => ({
              amount: `₹${(f.paidAmount || 0).toLocaleString('en-IN')}`,
              paid_on: f.paidAt
                ? new Date(f.paidAt).toLocaleDateString('en-IN')
                : 'N/A',
            })),
          },
        })
      }

      // ── My Notices ────────────────────────────────────────
      case 'get_my_notices': {
        const notices = await Notice.find({
          tenantId,
          $or: [
            { targetAudience: 'all' },
            { targetAudience: 'students' },
            { targetClass: student.class },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title message createdAt')
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            count: notices.length,
            notices: notices.map((n: any) => ({
              title: n.title,
              preview: n.message?.slice(0, 100) + (n.message?.length > 100 ? '...' : ''),
              date: new Date(n.createdAt).toLocaleDateString('en-IN'),
            })),
          },
        })
      }

      // ── My Homework ───────────────────────────────────────
      case 'get_my_homework': {
        const homework = await Homework.find({
          tenantId,
          class: student.class,
          dueDate: { $gte: new Date() },
        })
          .sort({ dueDate: 1 })
          .limit(10)
          .select('title subject dueDate description')
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            class: student.class,
            pending_count: homework.length,
            homework: homework.map((h: any) => ({
              title: h.title,
              subject: h.subject,
              due: h.dueDate
                ? new Date(h.dueDate).toLocaleDateString('en-IN')
                : 'N/A',
            })),
          },
        })
      }

      // ── My Profile ────────────────────────────────────────
      case 'get_my_profile': {
        return NextResponse.json({
          success: true,
          data: {
            class: `${student.class} ${student.section}`,
            roll_number: student.rollNo,
            admission_number: student.admissionNo,
            academic_year: student.academicYear,
            status: student.status,
          },
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown tool: ${tool}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Student Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}