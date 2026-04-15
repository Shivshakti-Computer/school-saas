// -------------------------------------------------------------
// FILE: src/app/api/students/profile/route.ts
// GET → student apna profile dekhe
// PUT → profile update (limited fields)
// -------------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || !['student', 'parent'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        // Student khud hai ya parent hai?
        if (session.user.role === 'student') {
            const student = await Student.findOne({
                userId: session.user.id,
                tenantId: session.user.tenantId,
            })
                .populate('userId', 'name phone email')
                .lean()

            if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
            return NextResponse.json({ student })

        } else {
            // Parent — apna student dhundho
            const parentUser = await User.findById(session.user.id).lean() as any
            if (!parentUser?.studentRef) {
                return NextResponse.json({ error: 'No child linked' }, { status: 404 })
            }

            const student = await Student.findOne({
                _id: parentUser.studentRef,
                tenantId: session.user.tenantId,
            })
                .populate('userId', 'name phone email')
                .lean()

            return NextResponse.json({ student })
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}