// src/app/api/chat/tools/teacher/route.ts
// UPDATED: 2026-04-06
// - Fixed Student→User name population
// - Fixed date handling (STRING for Attendance)
// - Added tenant validation

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Student } from '@/models/Student'
import { Attendance } from '@/models/Attendance'
import { Homework } from '@/models/Homework'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { connectDB } from '@/lib/db'
import { 
  getTodayDateString, 
  getDateRange, 
  getTodayDisplay,
  formatIndianDate 
} from '@/lib/date-helpers'

export async function POST(req: NextRequest) {
  try {
    // ✅ Internal AI call check
    const isInternalAI = req.headers.get('x-internal-ai') === 'true'

    if (isInternalAI) {
      const body = await req.json()
      const { tool, params, tenant_id } = body

      if (!tenant_id) {
        return NextResponse.json(
          { success: false, error: 'tenant_id required' },
          { status: 400 }
        )
      }

      await connectDB()
      const school = await School.findById(tenant_id).select('_id').lean()
      
      if (!school) {
        return NextResponse.json(
          { success: false, error: 'Invalid tenant' },
          { status: 400 }
        )
      }

      // For internal calls, we might not have userId
      // Teacher tools need class/section which come from params
      return await executeTeacherTool(tool, params, tenant_id, null)
    }

    // Regular session check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const role = session.user.role
    if (!['teacher', 'staff'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Teacher access required' },
        { status: 403 }
      )
    }

    const tenantId = (session.user as any)?.tenantId
    const userId = session.user.id

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No school found' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { tool, params = {} } = body

    await connectDB()

    return await executeTeacherTool(tool, params, tenantId, userId)

  } catch (error) {
    console.error('[Teacher Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}

async function executeTeacherTool(
  tool: string,
  params: any,
  tenantId: string,
  userId: string | null
): Promise<NextResponse> {

  // Get teacher's class/section from User model (if userId available)
  let teacherClass: string | null = null
  let teacherSection: string | null = null

  if (userId) {
    const teacherUser = await User.findById(userId)
      .select('class section subjects')
      .lean() as any

    teacherClass = params.class || teacherUser?.class || null
    teacherSection = params.section || teacherUser?.section || null
  } else {
    // Internal AI call - use params
    teacherClass = params.class || null
    teacherSection = params.section || null
  }

  switch (tool) {

    // ── My Students ───────────────────────────────────────
    case 'get_my_students': {
      const filter: any = { tenantId, status: 'active' }
      if (teacherClass) filter.class = teacherClass
      if (teacherSection) filter.section = teacherSection

      // ✅ FIX: Populate userId to get name
      const students = await Student.find(filter)
        .populate('userId', 'name')
        .sort({ rollNo: 1 })
        .limit(50)
        .lean()

      return NextResponse.json({
        success: true,
        data: {
          total: students.length,
          class: teacherClass || 'All',
          section: teacherSection || 'All',
          students: students.map((s: any) => ({
            // ✅ FIX: Access populated name
            name: s.userId?.name || 'Unknown',
            class: `${s.class} ${s.section}`,
            roll: s.rollNo,
            status: s.status,
          })),
        },
      })
    }

    // ── My Class Attendance Today ─────────────────────────
    case 'get_my_class_attendance_today': {
      // ✅ FIX: STRING date for Attendance
      const dateStr = getTodayDateString()

      const filter: any = { tenantId, date: dateStr }
      if (teacherClass) filter.class = teacherClass
      if (teacherSection) filter.section = teacherSection

      const studentFilter: any = { tenantId, status: 'active' }
      if (teacherClass) studentFilter.class = teacherClass
      if (teacherSection) studentFilter.section = teacherSection

      const [totalStudents, present, absent, late] = await Promise.all([
        Student.countDocuments(studentFilter),
        Attendance.countDocuments({ ...filter, status: 'present' }),
        Attendance.countDocuments({ ...filter, status: 'absent' }),
        Attendance.countDocuments({ ...filter, status: 'late' }),
      ])

      const marked = present + absent + late
      const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0

      return NextResponse.json({
        success: true,
        data: {
          date: getTodayDisplay(),
          class: `${teacherClass || 'All'} ${teacherSection || ''}`.trim(),
          present,
          absent,
          late,
          total_students: totalStudents,
          total_marked: marked,
          percentage: `${percentage}%`,
          is_marked: marked > 0,
        },
      })
    }

    // ── Student Attendance (Specific) ─────────────────────
    case 'get_student_attendance': {
      if (!params.studentName) {
        return NextResponse.json({
          success: false,
          error: 'Student name required',
        })
      }

      // ✅ FIX: Search in User model for name
      const userRecord = await User.findOne({
        tenantId,
        role: 'student',
        name: new RegExp(params.studentName, 'i'),
      }).lean() as any

      if (!userRecord) {
        return NextResponse.json({
          success: true,
          data: { message: `"${params.studentName}" naam ka student nahi mila` },
        })
      }

      const student = await Student.findOne({
        tenantId,
        userId: userRecord._id,
      }).lean() as any

      if (!student) {
        return NextResponse.json({
          success: true,
          data: { message: 'Student record nahi mila' },
        })
      }

      // ✅ FIX: STRING date range
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

      const total = present + absent + late
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      return NextResponse.json({
        success: true,
        data: {
          student_name: userRecord.name,
          class: `${student.class} ${student.section}`,
          period: 'Last 30 days',
          present,
          absent,
          late,
          attendance_percentage: `${percentage}%`,
          status: percentage >= 75 ? '✅ Good' : '⚠️ Low',
        },
      })
    }

    // ── Pending Homework ──────────────────────────────────
    case 'get_pending_homework': {
      const filter: any = {
        tenantId,
        dueDate: { $gte: new Date() },
      }
      if (teacherClass) filter.class = teacherClass

      const homework = await Homework.find(filter)
        .sort({ dueDate: 1 })
        .limit(10)
        .select('title class subject dueDate')
        .lean()

      return NextResponse.json({
        success: true,
        data: {
          count: homework.length,
          homework: homework.map((h: any) => ({
            title: h.title,
            class: h.class,
            subject: h.subject,
            due: h.dueDate
              ? new Date(h.dueDate).toLocaleDateString('en-IN')
              : 'N/A',
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