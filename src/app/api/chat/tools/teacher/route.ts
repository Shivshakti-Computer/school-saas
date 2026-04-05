// src/app/api/chat/tools/teacher/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Student } from '@/models/Student'
import { Attendance } from '@/models/Attendance'
import { Homework } from '@/models/Homework'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    if (!['teacher', 'staff'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Teacher access required' }, { status: 403 })
    }

    // ✅ tenantId
    const tenantId  = (session.user as any)?.tenantId
    const userId    = session.user.id

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'No school found' }, { status: 400 })
    }

    const body               = await req.json()
    const { tool, params = {} } = body

    await connectDB()

    // ✅ Teacher ki class/section User model se lo
    const teacherUser = await User.findById(userId)
      .select('class section subjects')
      .lean() as any

    const teacherClass   = params.class   || teacherUser?.class   || null
    const teacherSection = params.section || teacherUser?.section || null

    switch (tool) {

      case 'get_my_students': {
        const filter: any = { tenantId, status: 'active' }
        if (teacherClass)   filter.class   = teacherClass
        if (teacherSection) filter.section = teacherSection

        // ✅ name User model mein hai - populate karo
        const students = await Student.find(filter)
          .populate('userId', 'name')
          .sort({ rollNo: 1 })
          .limit(50)
          .lean()

        return NextResponse.json({
          success: true,
          data: {
            total:    students.length,
            class:    teacherClass || 'All',
            section:  teacherSection || 'All',
            students: students.map((s: any) => ({
              name:    s.userId?.name || 'Unknown',
              class:   `${s.class} ${s.section}`,
              roll:    s.rollNo,
              status:  s.status,
            })),
          },
        })
      }

      case 'get_my_class_attendance_today': {
        // ✅ String date
        const dateStr = new Date().toISOString().split('T')[0]

        const filter: any = { tenantId, date: dateStr }
        if (teacherClass)   filter.class   = teacherClass
        if (teacherSection) filter.section = teacherSection

        // Class ke students pehle lo
        const studentFilter: any = { tenantId, status: 'active' }
        if (teacherClass)   studentFilter.class   = teacherClass
        if (teacherSection) studentFilter.section = teacherSection

        const [totalStudents, present, absent, late] = await Promise.all([
          Student.countDocuments(studentFilter),
          Attendance.countDocuments({ ...filter, status: 'present' }),
          Attendance.countDocuments({ ...filter, status: 'absent' }),
          Attendance.countDocuments({ ...filter, status: 'late' }),
        ])

        const marked     = present + absent + late
        const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0

        return NextResponse.json({
          success: true,
          data: {
            date:          today_display(),
            class:         `${teacherClass || 'All'} ${teacherSection || ''}`.trim(),
            present,
            absent,
            late,
            total_students: totalStudents,
            total_marked:  marked,
            percentage:    `${percentage}%`,
            is_marked:     marked > 0,
          },
        })
      }

      case 'get_student_attendance': {
        if (!params.studentName) {
          return NextResponse.json({
            success: false,
            error: 'Student name required',
          })
        }

        // ✅ Name User model mein hai
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

        // Student record lo
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

        // ✅ String date range
        const today      = new Date()
        const thirtyAgo  = new Date()
        thirtyAgo.setDate(thirtyAgo.getDate() - 30)
        const todayStr   = today.toISOString().split('T')[0]
        const startStr   = thirtyAgo.toISOString().split('T')[0]

        const [present, absent, late] = await Promise.all([
          Attendance.countDocuments({
            tenantId,
            studentId: student._id,
            date: { $gte: startStr, $lte: todayStr },
            status: 'present',
          }),
          Attendance.countDocuments({
            tenantId,
            studentId: student._id,
            date: { $gte: startStr, $lte: todayStr },
            status: 'absent',
          }),
          Attendance.countDocuments({
            tenantId,
            studentId: student._id,
            date: { $gte: startStr, $lte: todayStr },
            status: 'late',
          }),
        ])

        const total      = present + absent + late
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0

        return NextResponse.json({
          success: true,
          data: {
            student_name:          userRecord.name,
            class:                 `${student.class} ${student.section}`,
            period:                'Last 30 days',
            present,
            absent,
            late,
            attendance_percentage: `${percentage}%`,
            status:                percentage >= 75 ? '✅ Good' : '⚠️ Low',
          },
        })
      }

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
            count:    homework.length,
            homework: homework.map((h: any) => ({
              title:   h.title,
              class:   h.class,
              subject: h.subject,
              due:     h.dueDate
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
  } catch (error) {
    console.error('[Teacher Tools] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    )
  }
}

function today_display(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}