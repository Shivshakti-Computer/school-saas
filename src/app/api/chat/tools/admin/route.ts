// src/app/api/chat/tools/admin/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { Staff } from '@/models/Staff'
import { Fee } from '@/models/Fee'
import { Attendance } from '@/models/Attendance'
import { Notice } from '@/models/Notice'

export type AdminTool =
  | 'get_school_stats'
  | 'get_attendance_today'
  | 'get_attendance_summary'
  | 'get_fee_summary'
  | 'get_pending_fees'
  | 'get_student_count'
  | 'get_staff_count'
  | 'get_recent_notices'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const role = session.user.role
    if (!['admin', 'staff', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // ✅ tenantId - session se
    const tenantId = (session.user as any)?.tenantId
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No school found' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { tool } = body as { tool: AdminTool }

    await connectDB()

    switch (tool) {

      // ── School Stats ─────────────────────────────────────
      case 'get_school_stats': {
        const [
          totalStudents,
          activeStudents,
          totalTeachers,
          activeTeachers,
          totalNonTeaching,
        ] = await Promise.all([
          // ✅ tenantId (schoolId nahi)
          Student.countDocuments({ tenantId }),
          Student.countDocuments({ tenantId, status: 'active' }),
          // ✅ staffCategory: 'teaching' (role: 'teacher' nahi)
          Staff.countDocuments({ tenantId, staffCategory: 'teaching' }),
          Staff.countDocuments({
            tenantId,
            staffCategory: 'teaching',
            status: 'active',
          }),
          Staff.countDocuments({
            tenantId,
            staffCategory: { $in: ['non_teaching', 'admin', 'support'] },
            status: 'active',
          }),
        ])

        return NextResponse.json({
          success: true,
          data: {
            total_students: totalStudents,
            active_students: activeStudents,
            total_teachers: totalTeachers,
            active_teachers: activeTeachers,
            total_staff: totalNonTeaching,
          },
        })
      }

      // ── Today's Attendance ───────────────────────────────
      case 'get_attendance_today': {
        // ✅ date field String hai "YYYY-MM-DD" format mein
        const today = new Date()
        const dateStr = today.toISOString().split('T')[0] // "2024-01-15"

        const [present, absent, late, totalStudents] = await Promise.all([
          Attendance.countDocuments({
            tenantId,
            date: dateStr,           // ✅ String comparison
            status: 'present',
          }),
          Attendance.countDocuments({
            tenantId,
            date: dateStr,
            status: 'absent',
          }),
          Attendance.countDocuments({
            tenantId,
            date: dateStr,
            status: 'late',
          }),
          Student.countDocuments({
            tenantId,
            status: 'active',
          }),
        ])

        const marked = present + absent + late
        const percentage = marked > 0
          ? Math.round((present / marked) * 100)
          : 0

        return NextResponse.json({
          success: true,
          data: {
            date: today.toLocaleDateString('en-IN'),
            date_str: dateStr,
            present,
            absent,
            late,
            not_marked: Math.max(0, totalStudents - marked),
            total_students: totalStudents,
            attendance_percentage: percentage,
            marked_count: marked,
          },
        })
      }

      // ── Attendance Summary (Last 30 days) ────────────────
      case 'get_attendance_summary': {
        // ✅ Date range for String date field
        const today = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // YYYY-MM-DD string format mein convert
        const todayStr = today.toISOString().split('T')[0]
        const startStr = thirtyDaysAgo.toISOString().split('T')[0]

        const [present, absent, late] = await Promise.all([
          Attendance.countDocuments({
            tenantId,
            // ✅ String comparison works for YYYY-MM-DD format
            date: { $gte: startStr, $lte: todayStr },
            status: 'present',
          }),
          Attendance.countDocuments({
            tenantId,
            date: { $gte: startStr, $lte: todayStr },
            status: 'absent',
          }),
          Attendance.countDocuments({
            tenantId,
            date: { $gte: startStr, $lte: todayStr },
            status: 'late',
          }),
        ])

        const total = present + absent + late
        const avgPercent = total > 0
          ? Math.round((present / total) * 100)
          : 0

        return NextResponse.json({
          success: true,
          data: {
            period: 'Last 30 days',
            present,
            absent,
            late,
            average_attendance: `${avgPercent}%`,
          },
        })
      }

      // ── Fee Summary ──────────────────────────────────────
      case 'get_fee_summary': {
        // ✅ finalAmount use karo (amount nahi - discount/fine ke baad)
        const currentMonthStart = new Date()
        currentMonthStart.setDate(1)
        currentMonthStart.setHours(0, 0, 0, 0)

        const [
          totalPaid,
          totalPending,
          paidThisMonth,
          overdueCount,
          partialCount,
        ] = await Promise.all([
          Fee.aggregate([
            { $match: { tenantId: tenantId, status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
          ]),
          Fee.aggregate([
            {
              $match: {
                tenantId: tenantId,
                status: { $in: ['pending', 'partial'] },
              },
            },
            {
              $group: {
                _id: null,
                // ✅ finalAmount - paidAmount = actual pending
                total: { $sum: { $subtract: ['$finalAmount', '$paidAmount'] } },
              },
            },
          ]),
          Fee.aggregate([
            {
              $match: {
                tenantId: tenantId,
                status: 'paid',
                paidAt: { $gte: currentMonthStart },
              },
            },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
          ]),
          Fee.countDocuments({
            tenantId,
            status: { $in: ['pending', 'partial'] },
            dueDate: { $lt: new Date() },
          }),
          Fee.countDocuments({
            tenantId,
            status: 'partial',
          }),
        ])

        return NextResponse.json({
          success: true,
          data: {
            total_collected: totalPaid[0]?.total || 0,
            total_pending: totalPending[0]?.total || 0,
            collected_this_month: paidThisMonth[0]?.total || 0,
            overdue_count: overdueCount,
            partial_count: partialCount,
            currency: '₹',
          },
        })
      }

      // ── Pending Fees List ────────────────────────────────
      case 'get_pending_fees': {
        const pending = await Fee.find({
          tenantId,
          status: { $in: ['pending', 'partial'] },
        })
          .populate('studentId', 'class section')  // ✅ name nahi - User mein hai
          .populate({
            path: 'studentId',
            select: 'class section userId',
            populate: {
              path: 'userId',
              model: 'User',
              select: 'name',
            },
          })
          .sort({ dueDate: 1 })
          .limit(10)
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            count: pending.length,
            fees: pending.map((f: any) => {
              const student = f.studentId
              const name = student?.userId?.name || 'Unknown'
              const pending = (f.finalAmount || 0) - (f.paidAmount || 0)
              return {
                student: name,
                class: `${student?.class || ''} ${student?.section || ''}`.trim(),
                amount: pending,
                due_date: f.dueDate
                  ? new Date(f.dueDate).toLocaleDateString('en-IN')
                  : 'N/A',
                status: f.status,
              }
            }),
          },
        })
      }

      // ── Student Count ────────────────────────────────────
      case 'get_student_count': {
        const byClass = await Student.aggregate([
          {
            $match: {
              tenantId: new (require('mongoose').Types.ObjectId)(tenantId),
              status: 'active',
            },
          },
          {
            $group: {
              _id: '$class',
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])

        const total = byClass.reduce((sum, c) => sum + c.count, 0)

        return NextResponse.json({
          success: true,
          data: {
            total_active: total,
            by_class: byClass.map(c => ({
              class: c._id || 'Unassigned',
              count: c.count,
            })),
          },
        })
      }

      // ── Staff Count ──────────────────────────────────────
      case 'get_staff_count': {
        // ✅ staffCategory use karo (role nahi)
        const byCategory = await Staff.aggregate([
          {
            $match: {
              tenantId: new (require('mongoose').Types.ObjectId)(tenantId),
              status: 'active',
            },
          },
          {
            $group: {
              _id: '$staffCategory',
              count: { $sum: 1 },
            },
          },
        ])

        const total = byCategory.reduce((sum, r) => sum + r.count, 0)

        // Department breakdown bhi do
        const byDepartment = await Staff.aggregate([
          {
            $match: {
              tenantId: new (require('mongoose').Types.ObjectId)(tenantId),
              status: 'active',
            },
          },
          {
            $group: {
              _id: '$department',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])

        return NextResponse.json({
          success: true,
          data: {
            total,
            by_category: byCategory.map(r => ({
              category: r._id,
              count: r.count,
            })),
            by_department: byDepartment.map(r => ({
              department: r._id || 'N/A',
              count: r.count,
            })),
          },
        })
      }

      // ── Recent Notices ───────────────────────────────────
      case 'get_recent_notices': {
        const notices = await Notice.find({ tenantId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title targetAudience createdAt')
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            count: notices.length,
            notices: notices.map((n: any) => ({
              title: n.title,
              date: new Date(n.createdAt).toLocaleDateString('en-IN'),
              audience: n.targetAudience || 'All',
            })),
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
    console.error('[Admin Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}