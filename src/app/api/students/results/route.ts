// -------------------------------------------------------------
// FILE: src/app/api/students/results/route.ts
// GET → student ke exam results
// -------------------------------------------------------------
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { Result } from '@/models/Exam'
import  '@/models/Exam'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || !['student', 'parent'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        // Student ID resolve karo
        let resolvedStudentId: string | null = null

        if (session.user.role === 'student') {
            const stu = await Student.findOne({
                userId: session.user.id,
                tenantId: session.user.tenantId,
            }).select('_id').lean()
            resolvedStudentId = stu?._id?.toString() ?? null
        } else {
            const parentUser = await User.findById(session.user.id).select('studentRef').lean() as any
            resolvedStudentId = parentUser?.studentRef?.toString() ?? null
        }

        if (!resolvedStudentId) {
            return NextResponse.json({ results: [] })
        }

        const results = await Result.find({
            tenantId: session.user.tenantId,
            studentId: resolvedStudentId,
        })
            .populate('examId', 'name class section academicYear')
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ results })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
