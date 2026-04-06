// src/app/api/chat/tools/admin/route.ts
// UPDATED: 2026-04-06
// - Added tenant validation for internal AI calls
// - Fixed date handling (STRING for Attendance, Date for Fee)
// - Added absent student list
// - Fixed field names (percentage not attendance_percentage)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Student } from '@/models/Student'
import { Staff } from '@/models/Staff'
import { Fee } from '@/models/Fee'
import { Attendance } from '@/models/Attendance'
import { Notice } from '@/models/Notice'
import { 
  getTodayDateString, 
  getDateRange, 
  formatIndianDate,
  getCurrentMonthStart 
} from '@/lib/date-helpers'

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
    // ✅ FIX 1: Check if internal AI call
    const isInternalAI = req.headers.get('x-internal-ai') === 'true'

    if (isInternalAI) {
      console.log('🤖 [Admin Tools] Internal AI call detected')

      const body = await req.json()
      const { tool, params, tenant_id } = body

      if (!tenant_id) {
        return NextResponse.json(
          { success: false, error: 'tenant_id required for AI calls' },
          { status: 400 }
        )
      }

      // ✅ FIX 2: Validate tenant exists
      await connectDB()
      const school = await School.findById(tenant_id).select('_id').lean()
      
      if (!school) {
        console.error(`[Admin Tools] Invalid tenant_id: ${tenant_id}`)
        return NextResponse.json(
          { success: false, error: 'Invalid tenant' },
          { status: 400 }
        )
      }

      console.log(`   Tool: ${tool} | Tenant: ${tenant_id.slice(-6)}`)

      return await executeAdminTool(tool, params, tenant_id)
    }

    // Regular user call - check session
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

    const tenantId = (session.user as any)?.tenantId
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No school found' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { tool, params } = body

    await connectDB()

    return await executeAdminTool(tool, params || {}, tenantId)

  } catch (error) {
    console.error('[Admin Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}

// ✅ FIX 3: Extract tool logic into separate function
async function executeAdminTool(
  tool: AdminTool,
  params: any,
  tenantId: string
): Promise<NextResponse> {

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
        Student.countDocuments({ tenantId }),
        Student.countDocuments({ tenantId, status: 'active' }),
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
      // ✅ FIX 4: Use STRING date for Attendance model
      const today = new Date()
      const dateStr = getTodayDateString()

      const [present, absent, late, totalStudents] = await Promise.all([
        Attendance.countDocuments({
          tenantId,
          date: dateStr,
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
      const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0

      // ✅ FIX 5: Get absent student list (if count <= 10)
      let absentStudents: any[] = []
      if (absent > 0 && absent <= 10) {
        const records = await Attendance.find({
          tenantId,
          date: dateStr,
          status: 'absent'
        })
          .populate({
            path: 'studentId',
            select: 'class section userId',
            populate: {
              path: 'userId',
              select: 'name'
            }
          })
          .limit(10)
          .lean()

        absentStudents = records.map((r: any) => ({
          name: r.studentId?.userId?.name || 'Unknown',
          class: `${r.studentId?.class || ''} ${r.studentId?.section || ''}`.trim()
        }))
      }

      return NextResponse.json({
        success: true,
        data: {
          date: formatIndianDate(dateStr),
          date_str: dateStr,
          present,
          absent,
          late,
          not_marked: Math.max(0, totalStudents - marked),
          total_students: totalStudents,
          // ✅ FIX 6: Use 'percentage' not 'attendance_percentage'
          percentage: percentage,
          marked_count: marked,
          // ✅ FIX 7: Add absent students list
          absent_students: absentStudents,
        },
      })
    }

    // ── Attendance Summary ────────────────────────────────
    case 'get_attendance_summary': {
      // ✅ FIX 8: STRING dates for Attendance model
      const { start, end } = getDateRange(30)

      const [present, absent, late] = await Promise.all([
        Attendance.countDocuments({
          tenantId,
          date: { $gte: start, $lte: end },
          status: 'present',
        }),
        Attendance.countDocuments({
          tenantId,
          date: { $gte: start, $lte: end },
          status: 'absent',
        }),
        Attendance.countDocuments({
          tenantId,
          date: { $gte: start, $lte: end },
          status: 'late',
        }),
      ])

      const total = present + absent + late
      const avgPercent = total > 0 ? Math.round((present / total) * 100) : 0

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
      // ✅ FIX 9: Use Date object for Fee.paidAt field
      const currentMonthStart = getCurrentMonthStart()

      const [totalPaid, totalPending, paidThisMonth, overdueCount, partialCount] = 
        await Promise.all([
          // ✅ FIX 10: Correct field names (paidAmount, finalAmount)
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
                total: { $sum: { $subtract: ['$finalAmount', '$paidAmount'] } },
              },
            },
          ]),
          Fee.aggregate([
            {
              $match: {
                tenantId: tenantId,
                status: 'paid',
                // ✅ FIX 11: paidAt field (not paymentDate)
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
            const pendingAmt = (f.finalAmount || 0) - (f.paidAmount || 0)
            return {
              student: name,
              class: `${student?.class || ''} ${student?.section || ''}`.trim(),
              amount: pendingAmt,
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
      const mongoose = require('mongoose')
      const byClass = await Student.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
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
      const mongoose = require('mongoose')
      const byCategory = await Staff.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
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

      const byDepartment = await Staff.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
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
}