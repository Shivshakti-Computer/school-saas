// src/app/api/chat/tools/parent/route.ts
// UPDATED: 2026-04-06
// - Fixed parent→student relationship (User.studentRef array)
// - Fixed date handling

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { Attendance } from '@/models/Attendance'
import { Fee } from '@/models/Fee'
import { Notice } from '@/models/Notice'
import { connectDB } from '@/lib/db'
import { getTodayDateString, getDateRange } from '@/lib/date-helpers'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Parent access required' },
        { status: 403 }
      )
    }

    const tenantId = (session.user as any)?.tenantId
    const parentUserId = session.user.id

    await connectDB()

    // ✅ FIX: Get studentRef array from User
    const parentUser = await User.findById(parentUserId)
      .select('studentRef name')
      .lean() as any

    if (!parentUser?.studentRef?.length) {
      return NextResponse.json({
        success: true,
        data: { message: 'No child linked. Contact school admin.' },
      })
    }

    // ✅ FIX: Get first child (support for multiple later)
    const child = await Student.findOne({
      tenantId,
      _id: parentUser.studentRef[0],
    })
      .populate('userId', 'name')
      .lean() as any

    if (!child) {
      return NextResponse.json({
        success: true,
        data: { message: 'Child record not found. Contact school admin.' },
      })
    }

    const childName = child.userId?.name || 'Your child'

    const body = await req.json()
    const { tool } = body

    switch (tool) {

      // ── Child Attendance ──────────────────────────────────
      case 'get_child_attendance': {
        // ✅ FIX: STRING dates
        const todayStr = getTodayDateString()
        const { start, end } = getDateRange(30)

        const [present, absent, late, todayRecord] = await Promise.all([
          Attendance.countDocuments({
            tenantId,
            studentId: child._id,
            date: { $gte: start, $lte: end },
            status: 'present',
          }),
          Attendance.countDocuments({
            tenantId,
            studentId: child._id,
            date: { $gte: start, $lte: end },
            status: 'absent',
          }),
          Attendance.countDocuments({
            tenantId,
            studentId: child._id,
            date: { $gte: start, $lte: end },
            status: 'late',
          }),
          Attendance.findOne({
            tenantId,
            studentId: child._id,
            date: todayStr,
          }).lean(),
        ])

        const total = present + absent + late
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0

        return NextResponse.json({
          success: true,
          data: {
            child_name: childName,
            class: `${child.class} ${child.section}`,
            today: (todayRecord as any)?.status || 'Not marked yet',
            period: 'Last 30 days',
            present,
            absent,
            late,
            percentage: `${percentage}%`,
            message:
              percentage >= 75
                ? `✅ ${childName} has good attendance!`
                : `⚠️ ${childName}'s attendance needs improvement.`,
          },
        })
      }

      // ── Child Fees ────────────────────────────────────────
      case 'get_child_fees': {
        const [pendingFees, paidFees] = await Promise.all([
          Fee.find({
            tenantId,
            studentId: child._id,
            status: { $in: ['pending', 'partial'] },
          })
            .sort({ dueDate: 1 })
            .select('finalAmount paidAmount dueDate status')
            .lean(),
          Fee.find({
            tenantId,
            studentId: child._id,
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
            child_name: childName,
            pending_amount: `₹${totalPending.toLocaleString('en-IN')}`,
            pending_count: pendingFees.length,
            pending_fees: pendingFees.map((f: any) => ({
              amount: `₹${((f.finalAmount || 0) - (f.paidAmount || 0)).toLocaleString('en-IN')}`,
              due: f.dueDate
                ? new Date(f.dueDate).toLocaleDateString('en-IN')
                : 'N/A',
              status: f.status,
            })),
            recent_payments: paidFees.map((f: any) => ({
              amount: `₹${(f.paidAmount || 0).toLocaleString('en-IN')}`,
              paid: f.paidAt
                ? new Date(f.paidAt).toLocaleDateString('en-IN')
                : 'N/A',
            })),
            action: pendingFees.length > 0
              ? 'Go to Fees section to pay online'
              : '✅ All fees paid!',
          },
        })
      }

      // ── Child Notices ─────────────────────────────────────
      case 'get_child_notices': {
        const notices = await Notice.find({
          tenantId,
          $or: [
            { targetAudience: 'all' },
            { targetAudience: 'parents' },
            { targetClass: child.class },
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
              preview: n.message?.slice(0, 100) || '',
              date: new Date(n.createdAt).toLocaleDateString('en-IN'),
            })),
          },
        })
      }

      // ── Child Profile ─────────────────────────────────────
      case 'get_child_profile': {
        return NextResponse.json({
          success: true,
          data: {
            name: childName,
            class: `${child.class} ${child.section}`,
            roll_number: child.rollNo,
            admission_number: child.admissionNo,
            academic_year: child.academicYear,
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
    console.error('[Parent Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}