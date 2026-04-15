// -------------------------------------------------------------
// FILE: src/app/api/students/attendance/route.ts
// GET → student ki attendance history (monthly/all)
// -------------------------------------------------------------
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { Attendance } from '@/models/Attendance'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || !['student', 'parent', 'teacher', 'admin'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const { searchParams } = req.nextUrl
        const month = searchParams.get('month')      // "2025-03"
        const studentId = searchParams.get('studentId')  // admin/teacher use karte hain

        // Student ID resolve karo
        let resolvedStudentId: string | null = null

        if (session.user.role === 'student') {
            const stu = await Student.findOne({
                userId: session.user.id,
                tenantId: session.user.tenantId,
            }).select('_id').lean()
            resolvedStudentId = stu?._id?.toString() ?? null

        } else if (session.user.role === 'parent') {
            const parentUser = await User.findById(session.user.id).select('studentRef').lean() as any
            resolvedStudentId = parentUser?.studentRef?.toString() ?? null

        } else if (['admin', 'teacher'].includes(session.user.role) && studentId) {
            resolvedStudentId = studentId
        }

        if (!resolvedStudentId) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        const query: any = {
            tenantId: session.user.tenantId,
            studentId: resolvedStudentId,
        }

        if (month) {
            const [year, mon] = month.split('-')
            query.date = {
                $gte: `${year}-${mon}-01`,
                $lte: `${year}-${mon}-31`,
            }
        }

        const records = await Attendance.find(query)
            .sort({ date: -1 })
            .lean()

        // Summary calculate karo
        const total = records.length
        const present = records.filter(r => r.status === 'present').length
        const absent = records.filter(r => r.status === 'absent').length
        const late = records.filter(r => r.status === 'late').length
        const pct = total > 0 ? Math.round((present / total) * 100) : 0

        return NextResponse.json({
            records,
            summary: { total, present, absent, late, percentage: pct },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}