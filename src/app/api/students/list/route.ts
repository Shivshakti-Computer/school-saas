/* ============================================================
   FILE: src/app/api/students/list/route.ts
   Get all students list with filters
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await connectDB()

        const { searchParams } = req.nextUrl
        const status = searchParams.get('status') || 'active'
        const cls = searchParams.get('class')
        const section = searchParams.get('section')

        // Build query
        const query: Record<string, unknown> = {
            tenantId: session.user.tenantId,
            status,
        }

        if (cls) query.class = cls
        if (section) query.section = section

        const students = await Student
            .find(query)
            .populate('userId', 'name phone email')
            .select('admissionNo class section rollNo status userId parentPhone')
            .sort({ class: 1, section: 1, rollNo: 1 })
            .lean()

        return NextResponse.json({ students })

    } catch (err) {
        console.error('[GET /api/students/list]', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}